import { useRef, useState } from "react";
import { File as FileIcon, UploadCloud } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  name: string;
  label: string;
  value: { name: string } | null;
  onChange: (v: { name: string } | null) => void;
  helperText?: string;
  required?: boolean;
  error?: string;
}

export function FileUploadField({
  name,
  label,
  value,
  onChange,
  helperText,
  required,
  error,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  const handleFile = (file: File | null | undefined) => {
    if (file) onChange({ name: file.name });
  };

  return (
    <div className="flex flex-col gap-2">
      <span className="text-[14px] font-medium text-ink-dark">
        {label}
        {required && <span className="ml-1 text-accent">*</span>}
      </span>
      {helperText && (
        <p className="text-[13px] leading-[1.5] text-ink-dark-muted">{helperText}</p>
      )}
      {value ? (
        <div className="toolbar-row rounded-[10px] border border-border-dark bg-bg-soft px-4 py-3">
          <div className="flex items-center gap-2">
            <FileIcon className="h-4 w-4 text-ink-dark" />
            <span className="text-[14px] text-ink-dark">{value.name}</span>
          </div>
          <button
            type="button"
            onClick={() => onChange(null)}
            className="text-[12px] text-ink-dark-muted transition-colors hover:text-[#E5484D]"
          >
            Удалить
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            handleFile(e.dataTransfer.files?.[0]);
          }}
          className={cn(
            "rounded-[14px] border-2 border-dashed bg-bg-elevated p-8 text-center transition-all duration-[180ms]",
            dragOver
              ? "border-accent bg-accent/5"
              : "border-border-dark-strong hover:border-accent/50 hover:bg-bg-soft",
          )}
        >
          <UploadCloud className="mx-auto h-7 w-7 text-ink-dark-muted" />
          <div className="mt-3 text-[14px] font-medium text-ink-dark">
            Перетащите файл или нажмите
          </div>
          <div className="text-[13px] text-ink-dark-muted">PDF, DOCX, TXT до 10 МБ</div>
        </button>
      )}
      <input
        ref={inputRef}
        id={name}
        name={name}
        type="file"
        className="hidden"
        accept=".pdf,.doc,.docx,.txt"
        onChange={(e) => handleFile(e.target.files?.[0])}
      />
      {error && <p className="mt-1 text-[12px] text-[#E5484D]">{error}</p>}
    </div>
  );
}
