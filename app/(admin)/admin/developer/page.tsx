"use client";

import Link from "next/link";
import { Key, Webhook, ArrowRight } from "lucide-react";

export default function DeveloperHubPage() {
  const sections = [
    {
      title: "API Keys",
      description: "Manage API keys for programmatic access. Keys are hashed and shown only once at creation.",
      href: "/admin/developer/api-keys",
      icon: Key,
      color: "bg-blue-600",
    },
    {
      title: "Outbound Webhooks",
      description: "Configure webhook endpoints to receive event notifications. Manage subscriptions, secrets, and delivery logs.",
      href: "/admin/developer/webhooks",
      icon: Webhook,
      color: "bg-purple-600",
    },
  ];

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Developer</h1>
        <p className="text-gray-600 mt-1">
          API keys and webhook integrations for developers
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {sections.map((section) => {
          const Icon = section.icon;
          return (
            <Link
              key={section.href}
              href={section.href}
              className="block p-6 bg-white rounded-lg border border-gray-200 hover:border-gray-300 hover:shadow-md transition-all group"
            >
              <div className="flex items-start gap-4">
                <div className={`${section.color} p-3 rounded-lg text-white`}>
                  <Icon className="h-6 w-6" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {section.title}
                    </h3>
                    <ArrowRight className="h-4 w-4 text-gray-400 group-hover:translate-x-1 transition-transform" />
                  </div>
                  <p className="text-sm text-gray-600 mt-1">{section.description}</p>
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      <div className="mt-8 p-4 bg-amber-50 border border-amber-200 rounded-lg">
        <h3 className="font-medium text-amber-800">Security Notice</h3>
        <ul className="mt-2 text-sm text-amber-700 list-disc list-inside space-y-1">
          <li>API keys and webhook secrets are only shown once at creation time</li>
          <li>Keys are stored as secure hashes — we cannot recover lost keys</li>
          <li>Rotate keys immediately if you suspect they have been compromised</li>
          <li>All key operations are logged in the admin audit trail</li>
        </ul>
      </div>
    </div>
  );
}
