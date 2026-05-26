import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ChevronRight } from "lucide-react";
import { CodeBlock } from "./ui/code-block";
import { cn } from "@/lib/utils";

interface Param {
  name: string;
  type: string;
  required: boolean;
  description: string;
}

interface Field {
  key: string;
  desc: string;
}

interface EndpointCardProps {
  method: string;
  path: string;
  description: string;
  detail: string;
  params: readonly Param[];
  request: string;
  response: string;
  fields: readonly Field[];
  defaultOpen?: boolean;
}

export function EndpointCard({
  method,
  path,
  description,
  detail,
  params,
  request,
  response,
  fields,
  defaultOpen = false,
}: EndpointCardProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div
      className={cn(
        "rounded-lg border overflow-hidden transition-colors duration-150 mb-3",
        open ? "border-black" : "border-warm-gray hover:border-mid-gray"
      )}
    >
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-3 px-5 py-4 cursor-pointer bg-white hover:bg-off-white transition-colors text-left"
      >
        <span className="font-mono text-[11px] font-medium px-2 py-0.5 rounded bg-black text-white tracking-wide">
          {method}
        </span>
        <span className="font-mono text-[15px] font-medium text-black">
          {path}
        </span>
        <span className="text-dark-gray text-[13px] ml-auto mr-2 hidden sm:block">
          {description}
        </span>
        <ChevronRight
          size={14}
          className={cn(
            "text-mid-gray transition-transform duration-200 shrink-0",
            open && "rotate-90"
          )}
        />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: "auto" }}
            exit={{ height: 0 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
          >
            <div className="border-t border-warm-gray bg-off-white px-5 py-5 space-y-5">
              <p className="text-sm text-dark-gray leading-relaxed">
                {detail}
              </p>

              {/* Params table */}
              <table className="w-full text-[13px] border-collapse">
                <thead>
                  <tr className="border-b-2 border-warm-gray">
                    <th className="text-left text-[11px] font-bold tracking-wider uppercase text-mid-gray py-2 px-3">
                      Parameter
                    </th>
                    <th className="text-left text-[11px] font-bold tracking-wider uppercase text-mid-gray py-2 px-3">
                      Type
                    </th>
                    <th className="text-left text-[11px] font-bold tracking-wider uppercase text-mid-gray py-2 px-3">
                      Description
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {params.map((p) => (
                    <tr key={p.name} className="border-b border-warm-gray">
                      <td className="py-2.5 px-3">
                        <code className="font-mono font-medium text-black">
                          {p.name}
                        </code>
                        {p.required && (
                          <span className="text-[10px] font-bold uppercase text-tt-red ml-1.5 tracking-wide">
                            required
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-dark-gray text-xs">
                        {p.type}
                      </td>
                      <td className="py-2.5 px-3 text-charcoal">
                        {p.description}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <CodeBlock
                code={request}
                language="bash"
                filename="Request"
              />
              <CodeBlock
                code={response}
                language="json"
                filename="Response"
              />

              {/* Fields */}
              <div>
                <h4 className="text-[11px] font-bold tracking-wider uppercase text-mid-gray mb-3">
                  Response Fields
                </h4>
                <ul className="space-y-0">
                  {fields.map((f) => (
                    <li
                      key={f.key}
                      className="flex gap-4 py-2 border-b border-warm-gray last:border-0 text-[13px]"
                    >
                      <code className="font-mono font-medium text-black min-w-[170px] shrink-0">
                        {f.key}
                      </code>
                      <span className="text-dark-gray leading-snug">
                        {f.desc}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
