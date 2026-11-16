import React from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Settings, Save, Loader2 } from "lucide-react";
import { Panel, RefreshButton, LoadingState } from "./AdminShared";

const prettyKey = (key) =>
  key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

export const SettingsTab = ({
  settingsList,
  editingSettings,
  setEditingSettings,
  savingKey,
  loading,
  onRefresh,
  onSave,
}) => (
  <Panel
    icon={Settings}
    title="Platform Settings & Fees"
    subtitle="Manage MoMo unlock fees, blocker subscriptions, and platform pricing"
    actions={<RefreshButton onClick={onRefresh} loading={loading} />}
  >
    {loading && settingsList.length === 0 ? (
      <LoadingState label="Loading settings..." />
    ) : (
      <div className="space-y-3">
        {settingsList.map((item) => {
          const currentValue = editingSettings[item.key] ?? item.value;
          const isSaving = savingKey === item.key;
          const hasChanged = String(currentValue) !== String(item.value);
          return (
            <div
              key={item.key}
              className="p-4 rounded-[9px] border border-brand-line bg-brand-bg-soft/30 hover:border-brand-green/40 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="max-w-md">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className="font-bold text-sm text-brand-ink">
                    {prettyKey(item.key)}
                  </span>
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded-[6px] bg-gray-100 text-gray-600 border border-gray-200">
                    {item.key}
                  </span>
                </div>
                {item.description && (
                  <p className="text-xs text-brand-ink-soft leading-relaxed">
                    {item.description}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <Input
                  type="text"
                  value={currentValue}
                  onChange={(e) =>
                    setEditingSettings((prev) => ({ ...prev, [item.key]: e.target.value }))
                  }
                  className="w-36 h-11 rounded-[9px] px-3 text-sm font-semibold text-right font-mono bg-white"
                />
                <Button
                  type="button"
                  onClick={() => onSave(item.key)}
                  disabled={isSaving || !hasChanged}
                  variant={hasChanged ? "default" : "outline"}
                  className="h-11 rounded-[9px] font-bold"
                >
                  {isSaving ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Save className="w-3.5 h-3.5" />
                  )}
                  Save
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    )}
  </Panel>
);