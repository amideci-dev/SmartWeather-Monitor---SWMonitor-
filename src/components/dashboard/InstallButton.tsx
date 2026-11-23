import { Download } from "lucide-react";
import { toast } from "sonner";
import { useInstallPrompt } from "@/hooks/useInstallPrompt";

export function InstallButton() {
  const { canInstall, showIosHint, install } = useInstallPrompt();
  if (!canInstall && !showIosHint) return null;

  const onClick = () => {
    if (canInstall) {
      void install();
    } else {
      toast("Installa SWMonitor", {
        description: "In Safari tocca Condividi, poi «Aggiungi alla schermata Home».",
        duration: 8000,
      });
    }
  };

  return (
    <button
      onClick={onClick}
      className="flex items-center gap-1.5 rounded-lg border px-2 py-1 text-xs font-medium text-primary transition-colors hover:bg-muted"
      title="Installa come app"
    >
      <Download className="h-3.5 w-3.5" />
      <span className="hidden sm:inline">Installa</span>
    </button>
  );
}
