/**
 * Seller Onboarding Progress Service
 * 
 * Manages the state machine for seller onboarding:
 * 1. basic_info - Application approved, account created (auto-complete)
 * 2. documents - KYC documents uploaded and approved
 * 3. verification - Admin verification complete, seller activated
 * 
 * Each step has requirements that must be met before advancing.
 */

import { db } from '@/db';
import { sellers, sellerKycDocuments, users } from '@/db/schema/core';
import { eq, and, inArray, desc } from 'drizzle-orm';

export type OnboardingStep = 'basic_info' | 'documents' | 'verification';
export type OnboardingStatus = 'not_started' | 'in_progress' | 'completed' | 'blocked';

export interface OnboardingRequirement {
  id: string;
  label: string;
  completed: boolean;
  blockedReason?: string;
}

export interface OnboardingStepInfo {
  step: OnboardingStep;
  status: OnboardingStatus;
  label: string;
  description: string;
  requirements: OnboardingRequirement[];
  completedAt?: string;
}

export interface SellerOnboardingProgress {
  sellerId: string;
  userId: string;
  brandName: string;
  email: string;
  sellerStatus: 'onboarding' | 'active' | 'suspended';
  currentStep: OnboardingStep;
  overallProgress: number; // 0-100
  steps: OnboardingStepInfo[];
  canActivate: boolean;
  blockedReason?: string;
  lastUpdatedAt: string;
  createdAt: string;
}

// Required document types for KYC
export const REQUIRED_DOCUMENTS = [
  { type: 'company_registration', label: 'Certificat de înregistrare', description: 'Certificat constatator sau alt document de înregistrare' },
  { type: 'cui_certificate', label: 'Certificat CUI', description: 'Document care atestă codul unic de identificare' },
  { type: 'id_document', label: 'Document de identitate', description: 'CI/pașaport administrator sau reprezentant legal' },
  { type: 'iban_proof', label: 'Dovada IBAN', description: 'Extras de cont sau document bancar cu IBAN-ul declarat' },
] as const;

export type RequiredDocumentType = typeof REQUIRED_DOCUMENTS[number]['type'];

/**
 * Get comprehensive onboarding progress for a seller
 */
export async function getSellerOnboardingProgress(
  sellerId: string
): Promise<SellerOnboardingProgress | null> {
  // Get seller with user info
  const [seller] = await db
    .select({
      id: sellers.id,
      userId: sellers.userId,
      brandName: sellers.brandName,
      email: sellers.email,
      status: sellers.status,
      cui: sellers.cui,
      iban: sellers.iban,
      cuiValidatedAt: sellers.cuiValidatedAt,
      ibanValidatedAt: sellers.ibanValidatedAt,
      createdAt: sellers.createdAt,
      updatedAt: sellers.updatedAt,
    })
    .from(sellers)
    .where(eq(sellers.id, sellerId))
    .limit(1);

  if (!seller) return null;

  // Get user email if seller email is null
  let email = seller.email;
  if (!email) {
    const [user] = await db
      .select({ email: users.email })
      .from(users)
      .where(eq(users.id, seller.userId))
      .limit(1);
    email = user?.email || 'unknown';
  }

  // Get KYC documents
  interface KycDocResult {
    id: string;
    docType: string;
    status: 'uploaded' | 'approved' | 'rejected' | 'superseded';
    filename: string;
    reviewMessage: string | null;
    createdAt: Date | null;
    reviewedAt: Date | null;
  }
  
  const documents: KycDocResult[] = await db
    .select({
      id: sellerKycDocuments.id,
      docType: sellerKycDocuments.docType,
      status: sellerKycDocuments.status,
      filename: sellerKycDocuments.filename,
      reviewMessage: sellerKycDocuments.reviewMessage,
      createdAt: sellerKycDocuments.createdAt,
      reviewedAt: sellerKycDocuments.reviewedAt,
    })
    .from(sellerKycDocuments)
    .where(
      and(
        eq(sellerKycDocuments.sellerId, sellerId),
        inArray(sellerKycDocuments.status, ['uploaded', 'approved', 'rejected'])
      )
    )
    .orderBy(desc(sellerKycDocuments.createdAt));

  // Build step info
  const steps: OnboardingStepInfo[] = [];

  // Step 1: Basic Info - Always complete if seller exists
  const basicInfoStep: OnboardingStepInfo = {
    step: 'basic_info',
    status: 'completed',
    label: 'Informații de bază',
    description: 'Date despre companie și cont',
    requirements: [
      { id: 'account_created', label: 'Cont creat', completed: true },
      { id: 'company_info', label: 'Date companie completate', completed: !!seller.brandName },
      { id: 'cui_provided', label: 'CUI furnizat', completed: !!seller.cui },
      { id: 'iban_provided', label: 'IBAN furnizat', completed: !!seller.iban },
    ],
    completedAt: seller.createdAt?.toISOString(),
  };
  steps.push(basicInfoStep);

  // Step 2: Documents
  const docRequirements: OnboardingRequirement[] = REQUIRED_DOCUMENTS.map((reqDoc) => {
    // Find latest document of this type (not superseded)
    const doc = documents.find((d) => d.docType === reqDoc.type);
    
    if (!doc) {
      return {
        id: reqDoc.type,
        label: reqDoc.label,
        completed: false,
        blockedReason: 'Document necesar, dar neîncărcat',
      };
    }

    if (doc.status === 'approved') {
      return { id: reqDoc.type, label: reqDoc.label, completed: true };
    }

    if (doc.status === 'rejected') {
      return {
        id: reqDoc.type,
        label: reqDoc.label,
        completed: false,
        blockedReason: doc.reviewMessage || 'Document respins - reîncarcă',
      };
    }

    // uploaded but pending review
    return {
      id: reqDoc.type,
      label: reqDoc.label,
      completed: false,
      blockedReason: 'În așteptarea verificării',
    };
  });

  const allDocsApproved = docRequirements.every((r) => r.completed);
  const anyDocRejected = documents.some((d) => d.status === 'rejected');
  const anyDocPending = documents.some((d) => d.status === 'uploaded');

  let documentsStatus: OnboardingStatus = 'not_started';
  if (allDocsApproved) {
    documentsStatus = 'completed';
  } else if (anyDocRejected) {
    documentsStatus = 'blocked';
  } else if (anyDocPending || documents.length > 0) {
    documentsStatus = 'in_progress';
  }

  const documentsStep: OnboardingStepInfo = {
    step: 'documents',
    status: documentsStatus,
    label: 'Documente',
    description: 'Documente KYC necesare pentru verificare',
    requirements: docRequirements,
    completedAt: allDocsApproved
      ? documents.find((d) => d.status === 'approved')?.reviewedAt?.toISOString()
      : undefined,
  };
  steps.push(documentsStep);

  // Step 3: Verification
  const verificationRequirements: OnboardingRequirement[] = [
    {
      id: 'docs_approved',
      label: 'Documente aprobate',
      completed: allDocsApproved,
      blockedReason: allDocsApproved ? undefined : 'Așteaptă aprobarea documentelor',
    },
    {
      id: 'cui_validated',
      label: 'CUI validat',
      completed: !!seller.cuiValidatedAt,
      blockedReason: seller.cuiValidatedAt ? undefined : 'CUI în curs de validare',
    },
    {
      id: 'iban_validated',
      label: 'IBAN validat',
      completed: !!seller.ibanValidatedAt,
      blockedReason: seller.ibanValidatedAt ? undefined : 'IBAN în curs de validare',
    },
    {
      id: 'account_activated',
      label: 'Cont activat',
      completed: seller.status === 'active',
      blockedReason: seller.status === 'active' ? undefined : 'Așteaptă activarea contului',
    },
  ];

  const isActive = seller.status === 'active';
  let verificationStatus: OnboardingStatus = 'not_started';
  if (isActive) {
    verificationStatus = 'completed';
  } else if (allDocsApproved) {
    verificationStatus = 'in_progress';
  }

  const verificationStep: OnboardingStepInfo = {
    step: 'verification',
    status: verificationStatus,
    label: 'Verificare',
    description: 'Verificare finală și activare cont',
    requirements: verificationRequirements,
    completedAt: isActive ? seller.updatedAt?.toISOString() : undefined,
  };
  steps.push(verificationStep);

  // Calculate overall progress
  const completedSteps = steps.filter((s) => s.status === 'completed').length;
  const overallProgress = Math.round((completedSteps / steps.length) * 100);

  // Determine current step
  let currentStep: OnboardingStep = 'basic_info';
  if (steps[0].status === 'completed' && steps[1].status !== 'completed') {
    currentStep = 'documents';
  } else if (steps[1].status === 'completed' && steps[2].status !== 'completed') {
    currentStep = 'verification';
  } else if (steps[2].status === 'completed') {
    currentStep = 'verification';
  }

  // Can activate?
  const canActivate = allDocsApproved && seller.status === 'onboarding';

  // Blocked reason
  let blockedReason: string | undefined;
  if (anyDocRejected) {
    const rejectedDoc = documents.find((d) => d.status === 'rejected');
    blockedReason = `Document respins: ${rejectedDoc?.docType} - ${rejectedDoc?.reviewMessage || 'Necesită reîncărcare'}`;
  }

  return {
    sellerId: seller.id,
    userId: seller.userId,
    brandName: seller.brandName,
    email: email || '',
    sellerStatus: seller.status,
    currentStep,
    overallProgress,
    steps,
    canActivate,
    blockedReason,
    lastUpdatedAt: seller.updatedAt?.toISOString() || new Date().toISOString(),
    createdAt: seller.createdAt?.toISOString() || new Date().toISOString(),
  };
}

/**
 * Get onboarding progress by user ID
 */
export async function getSellerOnboardingProgressByUserId(
  userId: string
): Promise<SellerOnboardingProgress | null> {
  const [seller] = await db
    .select({ id: sellers.id })
    .from(sellers)
    .where(eq(sellers.userId, userId))
    .limit(1);

  if (!seller) return null;
  return getSellerOnboardingProgress(seller.id);
}

/**
 * Activate a seller (move from onboarding to active)
 * Called by admin after all requirements are met
 */
export async function activateSeller(
  sellerId: string,
  actorId: string
): Promise<{ ok: boolean; error?: string }> {
  try {
    const progress = await getSellerOnboardingProgress(sellerId);
    
    if (!progress) {
      return { ok: false, error: 'Seller not found' };
    }

    if (!progress.canActivate) {
      return { ok: false, error: progress.blockedReason || 'Cannot activate - requirements not met' };
    }

    await db
      .update(sellers)
      .set({ status: 'active', updatedAt: new Date() })
      .where(eq(sellers.id, sellerId));

    return { ok: true };
  } catch (error) {
    console.error('activateSeller error:', error);
    return { ok: false, error: 'Internal error' };
  }
}
