import { Link } from "@tanstack/react-router";
import type { TenantPlanTier } from "@botmate/shared";
import { CABINET_RU, planLabelRu } from "@/lib/i18n/cabinet-ru";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PlanTierBadge } from "@/components/workspace/plan-tier-badge";

export function UpgradeModal(props: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  message: string;
  currentTier: TenantPlanTier;
  upgradeTier: TenantPlanTier | null;
  limitKey?: string;
}) {
  return (
    <Dialog open={props.open} onOpenChange={props.onOpenChange}>
      <DialogContent className="border-border bg-[#1a1a1a] text-white sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex flex-wrap items-center gap-2">
            {props.title}
            <PlanTierBadge tier={props.currentTier} />
          </DialogTitle>
          <DialogDescription className="text-white/55">{props.message}</DialogDescription>
        </DialogHeader>
        {props.upgradeTier ?
          <p className="text-sm text-lime-200/80">
            Тариф «{planLabelRu(props.upgradeTier)}» снимает ограничение и увеличивает лимиты.{" "}
            {CABINET_RU.upgrade.billingNote}
          </p>
        : null}
        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="ghostInk" onClick={() => props.onOpenChange(false)}>
            {CABINET_RU.common.close}
          </Button>
          <Button variant="brand" asChild>
            <Link to="/workspace">{CABINET_RU.common.viewPlan}</Link>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
