import * as React from "react";
import Glow from "@/shared/ui/glow";
import SshIcon from "@/features/marketing/logos/ssh";

interface TypingTextProps {
  text: string;
  speed?: number;
  pause?: number;
}

const TypingText: React.FC<TypingTextProps> = ({ text, speed = 50, pause = 1000 }) => {
  const [displayed, setDisplayed] = React.useState("");
  const [index, setIndex] = React.useState(0);

  // Reset typing when text changes
  React.useEffect(() => {
    setDisplayed("");
    setIndex(0);
  }, [text]);

  React.useEffect(() => {
    const type = () => {
      if (index < text.length) {
        setDisplayed(text.slice(0, index + 1));
        setIndex(index + 1);
      } else {
        setTimeout(() => setIndex(0), pause);
      }
    };

    const interval = setInterval(type, speed);
    return () => clearInterval(interval);
  }, [index, text, speed, pause]);

  return <span>{displayed}</span>;
};

function CodeEditorIllustration() {
  const sshText = `$ ssh -p30005 root@px-fr-1.octa.computer
The authenticity of host '[3d59cafa492b.octa.computer]:30005 ([37.59.97.239]:30005)' can't be established.
ED25519 key fingerprint is SHA256:aNjm2qcFoXYcbvl3eRQc1XBWOXY0Pe1WPmKjZH9LEfM.
This key is not known by any other names.
Are you sure you want to continue connecting (yes/no/[fingerprint])? yes
Warning: Permanently added '[3d59cafa492b.octa.computer]:30005' (ED25519) to the list of known hosts.
Welcome to Ubuntu 24.04.3 LTS (GNU/Linux 6.8.0-79-generic x86_64)

root@3d59cafa492b:~# _`;

  return (
    <div data-slot="code-editor-illustration" className="h-full w-full">
      <div className="relative h-full w-full">
        <div className="absolute top-0 left-[50%] z-10 w-full -translate-x-[50%] translate-y-0">
          <div className="border-border/100 bg-muted dark:border-border/5 dark:border-t-border/15 dark:bg-accent/30 relative flex min-h-[540px] min-w-[460px] flex-col gap-4 rounded-[12px] border">
            {/* File header */}
            <div className="flex w-full items-center justify-start gap-4 overflow-hidden py-2">
              <div className="hidden gap-2 pl-4 lg:flex">
                <div className="bg-accent dark:bg-foreground/10 size-3 rounded-full"></div>
                <div className="bg-accent dark:bg-foreground/10 size-3 rounded-full"></div>
                <div className="bg-accent dark:bg-foreground/10 size-3 rounded-full"></div>
              </div>

              <div className="relative flex w-[160px]">
                <div className="text-muted-foreground relative z-10 flex grow basis-0 items-center gap-2 px-4 py-1.5 text-xs">
                  <SshIcon className="size-4" />
                  <p>Terminal</p>
                </div>

                <div className="absolute top-0 left-0 h-full w-full px-2">
                  <div className="glass-4 h-full w-full rounded-md shadow-md"></div>
                </div>
              </div>
            </div>

            {/* Typing code area */}
            <div className="relative w-full grow overflow-hidden">
              <div className="absolute top-0 left-0 px-8 transition-all duration-1000 ease-in-out">
                <pre className="text-muted-foreground font-mono text-xs whitespace-pre-wrap">
                  <TypingText text={sshText} speed={20} pause={1500} />
                </pre>
              </div>
            </div>
          </div>
        </div>

        <Glow
          variant="below"
          className="translate-y-32 scale-150 opacity-40 transition-all duration-1000 group-hover:scale-200 group-hover:opacity-60"
        />
      </div>
    </div>
  );
}

export default CodeEditorIllustration;
