"use client";

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { ArrowLeft, CheckCircle, Circle, AlertCircle, Clock, Upload, FileText, Loader2, HelpCircle, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

type OnboardingStep = 'basic_info' | 'documents' | 'verification';
type OnboardingStatus = 'not_started' | 'in_progress' | 'completed' | 'blocked';

interface OnboardingRequirement {
  id: string;
  label: string;
  completed: boolean;
  blockedReason?: string;
}

interface OnboardingStepInfo {
  step: OnboardingStep;
  status: OnboardingStatus;
  label: string;
  description: string;
  requirements: OnboardingRequirement[];
  completedAt?: string;
}

interface SellerOnboardingProgress {
  sellerId: string;
  userId: string;
  brandName: string;
  email: string;
  sellerStatus: 'onboarding' | 'active' | 'suspended';
  currentStep: OnboardingStep;
  overallProgress: number;
  steps: OnboardingStepInfo[];
  canActivate: boolean;
  blockedReason?: string;
  lastUpdatedAt: string;
  createdAt: string;
}

const REQUIRED_DOCUMENTS = [
  { type: 'company_registration', label: 'Certificat de înregistrare', description: 'Certificat constatator sau alt document de înregistrare' },
  { type: 'cui_certificate', label: 'Certificat CUI', description: 'Document care atestă codul unic de identificare' },
  { type: 'id_document', label: 'Document de identitate', description: 'CI/pașaport administrator sau reprezentant legal' },
  { type: 'iban_proof', label: 'Dovada IBAN', description: 'Extras de cont sau document bancar cu IBAN-ul declarat' },
];

function StepIcon({ status }: { status: OnboardingStatus }) {
  if (status === 'completed') {
    return <CheckCircle className="h-5 w-5 text-green-600" />;
  }
  if (status === 'blocked') {
    return <AlertCircle className="h-5 w-5 text-red-500" />;
  }
  if (status === 'in_progress') {
    return <Clock className="h-5 w-5 text-amber-500" />;
  }
  return <Circle className="h-5 w-5 text-slate-300" />;
}

function RequirementItem({ req }: { req: OnboardingRequirement }) {
  return (
    <div className="flex items-start gap-3 py-2">
      {req.completed ? (
        <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
      ) : req.blockedReason ? (
        <AlertCircle className="h-4 w-4 text-amber-500 mt-0.5 flex-shrink-0" />
      ) : (
        <Circle className="h-4 w-4 text-slate-300 mt-0.5 flex-shrink-0" />
      )}
      <div className="flex-1 min-w-0">
        <div className={`text-sm font-medium ${req.completed ? 'text-green-700 dark:text-green-400' : 'text-slate-700 dark:text-slate-300'}`}>
          {req.label}
        </div>
        {req.blockedReason && !req.completed && (
          <div className="text-xs text-amber-600 dark:text-amber-400 mt-0.5">
            {req.blockedReason}
          </div>
        )}
      </div>
    </div>
  );
}

export default function SellerOnboardingClient() {
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState<SellerOnboardingProgress | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState<string | null>(null);

  const loadProgress = useCallback(async () => {
    try {
      const res = await fetch('/api/seller/onboarding/progress', {
        credentials: 'include',
        cache: 'no-store',
      });

      if (res.status === 404) {
        const data = await res.json();
        setError(data.message || 'Nu ai un cont de vânzător.');
        setProgress(null);
        return;
      }

      if (!res.ok) {
        throw new Error('Failed to load progress');
      }

      const data = await res.json();
      setProgress(data.progress);
      setError(null);
    } catch (err) {
      console.error('Load progress error:', err);
      setError('Eroare la încărcarea progresului. Încearcă din nou.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProgress();
  }, [loadProgress]);

  const handleFileUpload = async (docType: string, file: File) => {
    if (!progress) return;

    setUploading(docType);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('docType', docType);

      const res = await fetch('/api/seller/documents/upload', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Upload failed');
      }

      toast.success('Document încărcat cu succes!');
      await loadProgress();
    } catch (err) {
      console.error('Upload error:', err);
      toast.error(err instanceof Error ? err.message : 'Eroare la încărcare');
    } finally {
      setUploading(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="mt-4 text-slate-600 dark:text-slate-400">Se încarcă...</p>
        </div>
      </div>
    );
  }

  if (error || !progress) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
        <header className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <Link href="/" className="flex items-center gap-2 text-slate-600 dark:text-slate-300 hover:text-slate-900">
                <ArrowLeft className="h-4 w-4" />
                Înapoi
              </Link>
              <Link href="/" className="text-xl font-bold text-slate-900 dark:text-slate-100">
                FloristMarket.ro
              </Link>
            </div>
          </div>
        </header>

        <div className="max-w-2xl mx-auto px-4 py-16 text-center">
          <AlertCircle className="h-12 w-12 text-amber-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-4">
            {error || 'Cont vânzător negăsit'}
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mb-8">
            Dacă ai trimis deja o aplicație, te rugăm să aștepți aprobarea. Vei primi un email când contul tău este activat.
          </p>
          <div className="flex gap-4 justify-center">
            <Button asChild variant="secondary">
              <Link href="/devino-vanzator">
                Trimite aplicație
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/ajutor">
                <HelpCircle className="h-4 w-4 mr-2" />
                Ajutor
              </Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // If seller is already active, redirect to dashboard
  if (progress.sellerStatus === 'active') {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
        <header className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <Link href="/seller" className="flex items-center gap-2 text-slate-600 dark:text-slate-300 hover:text-slate-900">
                <ArrowLeft className="h-4 w-4" />
                Dashboard
              </Link>
              <Link href="/" className="text-xl font-bold text-slate-900 dark:text-slate-100">
                FloristMarket.ro
              </Link>
            </div>
          </div>
        </header>

        <div className="max-w-2xl mx-auto px-4 py-16 text-center">
          <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-4">
            Contul tău este activ! 🎉
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mb-8">
            Felicitări! Poți începe să vinzi pe FloristMarket.
          </p>
          <div className="flex gap-4 justify-center">
            <Button asChild>
              <Link href="/seller/products/new">
                Adaugă primul produs
              </Link>
            </Button>
            <Button asChild variant="secondary">
              <Link href="/seller">
                Dashboard vânzător
              </Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const currentStepIndex = progress.steps.findIndex((s) => s.step === progress.currentStep);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      {/* Header */}
      <header className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/seller" className="flex items-center gap-2 text-slate-600 dark:text-slate-300 hover:text-slate-900">
              <ArrowLeft className="h-4 w-4" />
              Înapoi
            </Link>
            <Link href="/" className="text-xl font-bold text-slate-900 dark:text-slate-100">
              FloristMarket.ro
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Title */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-2">
            Onboarding Vânzător
          </h1>
          <p className="text-slate-600 dark:text-slate-300">
            Completează procesul de înregistrare pentru a deveni vânzător pe FloristMarket.ro
          </p>
        </div>

        {/* Progress Stepper */}
        <Card className="mb-8">
          <CardContent className="pt-6">
            {/* Step indicators */}
            <div className="flex items-center justify-between mb-4">
              {progress.steps.map((step, idx) => (
                <div key={step.step} className="flex items-center gap-2">
                  <StepIcon status={step.status} />
                  <span className={`text-sm font-medium ${
                    step.status === 'completed' ? 'text-green-700 dark:text-green-400' :
                    step.status === 'in_progress' ? 'text-amber-700 dark:text-amber-400' :
                    step.status === 'blocked' ? 'text-red-700 dark:text-red-400' :
                    'text-slate-500 dark:text-slate-400'
                  }`}>
                    {step.label}
                  </span>
                  {idx < progress.steps.length - 1 && (
                    <div className="hidden sm:block w-8 h-px bg-slate-200 dark:bg-slate-700 mx-2" />
                  )}
                </div>
              ))}
            </div>

            {/* Progress bar */}
            <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
              <div 
                className="bg-green-600 h-2 rounded-full transition-all duration-500"
                style={{ width: `${progress.overallProgress}%` }}
              />
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400 text-center mt-2">
              {progress.overallProgress}% completat
            </p>
          </CardContent>
        </Card>

        {/* Blocked Warning */}
        {progress.blockedReason && (
          <Card className="mb-6 border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/20">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
                <div>
                  <h3 className="font-medium text-red-900 dark:text-red-100">Atenție</h3>
                  <p className="text-sm text-red-700 dark:text-red-300 mt-1">{progress.blockedReason}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Steps */}
        <div className="space-y-6">
          {progress.steps.map((step, idx) => (
            <Card key={step.step} className={
              step.status === 'completed' ? 'border-green-200 dark:border-green-900' :
              step.status === 'blocked' ? 'border-red-200 dark:border-red-900' :
              idx === currentStepIndex ? 'border-primary ring-2 ring-primary/20' :
              ''
            }>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <StepIcon status={step.status} />
                    <div>
                      <CardTitle className="text-lg">{step.label}</CardTitle>
                      <CardDescription>{step.description}</CardDescription>
                    </div>
                  </div>
                  <Badge variant={
                    step.status === 'completed' ? 'success' :
                    step.status === 'blocked' ? 'danger' :
                    step.status === 'in_progress' ? 'warning' :
                    'neutral'
                  }>
                    {step.status === 'completed' ? 'Completat' :
                     step.status === 'blocked' ? 'Blocat' :
                     step.status === 'in_progress' ? 'În progres' :
                     'Nepornit'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                {/* Step 1: Basic Info */}
                {step.step === 'basic_info' && (
                  <div className="space-y-2">
                    {step.requirements.map((req) => (
                      <RequirementItem key={req.id} req={req} />
                    ))}
                    {step.status === 'completed' && step.completedAt && (
                      <p className="text-xs text-slate-500 mt-4">
                        Completat la {new Date(step.completedAt).toLocaleDateString('ro-RO')}
                      </p>
                    )}
                  </div>
                )}

                {/* Step 2: Documents */}
                {step.step === 'documents' && (
                  <div className="space-y-4">
                    {REQUIRED_DOCUMENTS.map((doc) => {
                      const req = step.requirements.find((r) => r.id === doc.type);
                      const isUploading = uploading === doc.type;
                      
                      return (
                        <div key={doc.type} className="border border-slate-200 dark:border-slate-700 rounded-lg p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex items-start gap-3">
                              {req?.completed ? (
                                <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                              ) : (
                                <FileText className="h-5 w-5 text-slate-400 mt-0.5" />
                              )}
                              <div>
                                <div className="font-medium text-slate-900 dark:text-slate-100">{doc.label}</div>
                                <div className="text-sm text-slate-500 dark:text-slate-400">{doc.description}</div>
                                {req?.blockedReason && !req.completed && (
                                  <div className="text-sm text-amber-600 dark:text-amber-400 mt-1">
                                    {req.blockedReason}
                                  </div>
                                )}
                              </div>
                            </div>
                            {!req?.completed && (
                              <label className="cursor-pointer">
                                <input
                                  type="file"
                                  className="hidden"
                                  accept=".pdf,.jpg,.jpeg,.png"
                                  disabled={isUploading}
                                  onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) handleFileUpload(doc.type, file);
                                  }}
                                />
                                <Button variant="secondary" size="sm" disabled={isUploading} asChild>
                                  <span>
                                    {isUploading ? (
                                      <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                      <>
                                        <Upload className="h-4 w-4 mr-1" />
                                        Încarcă
                                      </>
                                    )}
                                  </span>
                                </Button>
                              </label>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Step 3: Verification */}
                {step.step === 'verification' && (
                  <div className="space-y-2">
                    {step.requirements.map((req) => (
                      <RequirementItem key={req.id} req={req} />
                    ))}
                    {step.status !== 'completed' && (
                      <div className="mt-4 p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                          După ce toate documentele sunt aprobate, echipa noastră va verifica informațiile și va activa contul tău. 
                          Procesul durează de obicei 1-2 zile lucrătoare.
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Help Section */}
        <Card className="mt-8">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <HelpCircle className="h-5 w-5 text-slate-400" />
                <div>
                  <div className="font-medium text-slate-900 dark:text-slate-100">Ai nevoie de ajutor?</div>
                  <div className="text-sm text-slate-500">
                    Referință: <span className="font-mono">{progress.sellerId.slice(0, 8)}</span>
                  </div>
                </div>
              </div>
              <Button variant="outline" size="sm" asChild>
                <Link href="/ajutor">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Contactează suport
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
