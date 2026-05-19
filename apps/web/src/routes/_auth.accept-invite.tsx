import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { apiClient } from "@/lib/api/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { CABINET_RU } from "@/lib/i18n/cabinet-ru";

const searchSchema = z.object({
  token: z.string().optional(),
});

export const Route = createFileRoute("/_auth/accept-invite")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [{ title: "Приглашение — botme" }],
  }),
  component: AcceptInvitePage,
});

function AcceptInvitePage() {
  const { token: tokenFromUrl } = Route.useSearch();
  const navigate = useNavigate();
  const [token, setToken] = useState(tokenFromUrl ?? "");
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!token.trim() || !fullName.trim() || password.length < 8) {
      toast.error(CABINET_RU.accept.fillAll);
      return;
    }
    setLoading(true);
    try {
      await apiClient.acceptInvite({ token: token.trim(), fullName: fullName.trim(), password });
      toast.success(CABINET_RU.accept.welcome);
      await navigate({ to: "/app" });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : CABINET_RU.accept.failed);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-4 py-12 text-white">
      <h1 className="mb-2 text-2xl font-semibold">{CABINET_RU.accept.title}</h1>
      <p className="mb-6 text-sm text-white/55">{CABINET_RU.accept.description}</p>
      <div className="space-y-4">
        <Input
          placeholder={CABINET_RU.accept.tokenPlaceholder}
          value={token}
          onChange={(e) => setToken(e.target.value)}
          className="bg-[#1a1a1a] border-[#2a2a2a]"
        />
        <Input
          placeholder={CABINET_RU.accept.namePlaceholder}
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          className="bg-[#1a1a1a] border-[#2a2a2a]"
        />
        <Input
          type="password"
          placeholder={CABINET_RU.accept.passwordPlaceholder}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="bg-[#1a1a1a] border-[#2a2a2a]"
        />
        <Button variant="brand" className="w-full" disabled={loading} onClick={() => void submit()}>
          {CABINET_RU.accept.submit}
        </Button>
        <p className="text-center text-xs text-white/45">
          {CABINET_RU.accept.haveAccount}{" "}
          <Link to="/login" className="text-lime-400 underline">
            {CABINET_RU.accept.login}
          </Link>
        </p>
      </div>
    </div>
  );
}
