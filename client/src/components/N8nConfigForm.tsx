import React from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { fetchConfigState, setN8nConfig } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import type { N8nConfigState } from "@shared/schema";

const configSchema = z.object({
  url: z.string().url("Please enter a valid URL").min(1, "URL is required"),
  apiKey: z.string(),
});

type ConfigFormValues = z.infer<typeof configSchema>;

interface N8nConfigFormProps {
  onSuccess: () => void;
}

const N8nConfigForm: React.FC<N8nConfigFormProps> = ({ onSuccess }) => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isBootstrapping, setIsBootstrapping] = React.useState(true);
  const [configState, setConfigState] = React.useState<N8nConfigState | null>(null);

  const form = useForm<ConfigFormValues>({
    resolver: zodResolver(configSchema),
    defaultValues: {
      url: "",
      apiKey: "",
    },
  });

  React.useEffect(() => {
    let active = true;

    const loadConfig = async () => {
      try {
        const state = await fetchConfigState();
        if (!active) {
          return;
        }

        setConfigState(state);
        form.reset({
          url: state.url,
          apiKey: "",
        });
      } catch {
        if (active) {
          setConfigState(null);
        }
      } finally {
        if (active) {
          setIsBootstrapping(false);
        }
      }
    };

    void loadConfig();

    return () => {
      active = false;
    };
  }, [form]);

  const onSubmit = async (data: ConfigFormValues) => {
    setIsSubmitting(true);
    try {
      const result = await setN8nConfig(data.url, data.apiKey.trim());
      setConfigState(result.config);
      form.reset({
        url: result.config.url,
        apiKey: "",
      });
      toast({
        title: "Configuration saved",
        description: "The n8n connection was verified and stored on the server.",
      });
      onSuccess();
    } catch (error) {
      toast({
        title: "Configuration failed",
        description: error instanceof Error ? error.message : "Failed to save configuration",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="surface-panel mb-6 p-6 sm:p-7">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="eyebrow">Connection</p>
          <h2 className="mt-3 text-2xl font-bold text-[hsl(var(--text-dark))]">
            Connect Achtlet to your n8n instance
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[hsl(var(--muted-foreground))]">
            Configuration is stored server-side. The API key is never sent back to the
            browser after save.
          </p>
        </div>

        {configState && (
          <div className="rounded-2xl border border-[hsl(var(--border))] bg-white/75 px-4 py-3 text-sm text-[hsl(var(--muted-foreground))]">
            <p className="font-semibold text-[hsl(var(--text-dark))]">
              Source: {configState.source === "environment" ? "environment" : configState.configured ? "saved file" : "not configured"}
            </p>
            {configState.apiKeyConfigured && (
              <p className="mt-1">An API key is already stored on the server.</p>
            )}
          </div>
        )}
      </div>

      {configState?.locked && (
        <div className="mb-6 rounded-2xl border border-[hsl(var(--secondary))]/25 bg-[hsl(var(--secondary))]/8 px-4 py-3 text-sm text-[hsl(var(--highlight-color))]">
          This installation is locked by `N8N_URL` and/or `N8N_API_KEY` environment
          variables. Update those server-side to change the connection.
        </div>
      )}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
          <FormField
            control={form.control}
            name="url"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-semibold text-[hsl(var(--text-dark))]">
                  n8n URL
                </FormLabel>
                <FormControl>
                  <Input
                    placeholder="https://your-n8n-instance.com"
                    className="h-12 rounded-2xl border-[hsl(var(--border))] bg-white"
                    disabled={configState?.locked || isSubmitting || isBootstrapping}
                    {...field}
                  />
                </FormControl>
                <FormMessage className="font-medium" />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="apiKey"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-semibold text-[hsl(var(--text-dark))]">
                  API key
                </FormLabel>
                <FormControl>
                  <Input
                    placeholder={
                      configState?.apiKeyConfigured
                        ? "Leave blank to keep the current key"
                        : "Paste an n8n API key"
                    }
                    type="password"
                    className="h-12 rounded-2xl border-[hsl(var(--border))] bg-white"
                    disabled={configState?.locked || isSubmitting || isBootstrapping}
                    {...field}
                  />
                </FormControl>
                <FormMessage className="font-medium" />
                <p className="text-xs leading-5 text-[hsl(var(--muted-foreground))]">
                  Needs `workflows:read`, `workflows:update`, and access to executions if
                  you want full functionality.
                </p>
              </FormItem>
            )}
          />

          <div className="flex flex-wrap gap-3">
            <Button
              type="button"
              variant="outline"
              className="rounded-2xl border-[hsl(var(--border))]"
              onClick={() =>
                form.reset({
                  url: configState?.url || "",
                  apiKey: "",
                })
              }
              disabled={isSubmitting || isBootstrapping}
            >
              Reset
            </Button>

            <Button
              type="submit"
              className="min-w-[180px] rounded-2xl border-b-4 border-b-[hsl(var(--highlight-color))]"
              disabled={configState?.locked || isSubmitting || isBootstrapping}
            >
              {isSubmitting ? "Verifying..." : "Save Connection"}
            </Button>
          </div>

          <div className="rounded-2xl border border-[hsl(var(--border))] bg-white/70 px-4 py-3 text-xs leading-5 text-[hsl(var(--muted-foreground))]">
            Achtlet stores your connection server-side so the Android PWA can reconnect after
            app restarts. If you prefer immutable config, set `N8N_URL` and
            `N8N_API_KEY` via environment variables instead.
          </div>
        </form>
      </Form>
    </section>
  );
};

export default N8nConfigForm;
