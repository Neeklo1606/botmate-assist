import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { UserPlus } from "lucide-react";
import { apiClient } from "@/lib/api/client";
import { qk } from "@/lib/query-keys";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { UpgradeModal } from "@/components/workspace/upgrade-modal";
import { CABINET_RU } from "@/lib/i18n/cabinet-ru";
import type { TenantPlanTier } from "@botmate/shared";

export function InviteMemberDialog(props: { planTier: TenantPlanTier }) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"ADMIN" | "OPERATOR" | "VIEWER">("OPERATOR");
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [upgradeMsg, setUpgradeMsg] = useState("");
  const qc = useQueryClient();

  const invite = useMutation({
    mutationFn: () => apiClient.createWorkspaceInvite({ email: email.trim(), role }),
    onSuccess: (res) => {
      toast.success(CABINET_RU.invite.created);
      if (res.invite.inviteUrl) {
        void navigator.clipboard.writeText(res.invite.inviteUrl);
        toast.message(CABINET_RU.invite.linkCopied);
      }
      setOpen(false);
      setEmail("");
      void qc.invalidateQueries({ queryKey: qk.workspace.members });
      void qc.invalidateQueries({ queryKey: qk.workspace.invites });
    },
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : CABINET_RU.invite.limitReached;
      if (msg.includes("PLAN_LIMIT_MEMBERS") || msg.includes("Member limit")) {
        setUpgradeMsg(msg);
        setUpgradeOpen(true);
        return;
      }
      toast.error(msg);
    },
  });

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant="brand" size="md">
            <UserPlus className="h-4 w-4" />
            {CABINET_RU.invite.inviteLabel}
          </Button>
        </DialogTrigger>
        <DialogContent className="border-border bg-[#1a1a1a] text-white">
          <DialogHeader>
            <DialogTitle>{CABINET_RU.invite.title}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              type="email"
              placeholder={CABINET_RU.invite.placeholder}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-[#141414] border-[#2a2a2a]"
            />
            <Select value={role} onValueChange={(v) => setRole(v as typeof role)}>
              <SelectTrigger className="bg-[#141414] border-[#2a2a2a]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ADMIN">{CABINET_RU.invite.roleAdmin}</SelectItem>
                <SelectItem value="OPERATOR">{CABINET_RU.invite.roleOperator}</SelectItem>
                <SelectItem value="VIEWER">{CABINET_RU.invite.roleViewer}</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="brand"
              className="w-full"
              disabled={!email.trim() || invite.isPending}
              onClick={() => invite.mutate()}
            >
              {CABINET_RU.invite.submit}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      <UpgradeModal
        open={upgradeOpen}
        onOpenChange={setUpgradeOpen}
        title={CABINET_RU.invite.limitReached}
        message={upgradeMsg}
        currentTier={props.planTier}
        upgradeTier={props.planTier === "starter" ? "pro" : props.planTier === "pro" ? "enterprise" : null}
        limitKey="members"
      />
    </>
  );
}
