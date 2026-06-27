import { useForm, useController } from "react-hook-form";
import { Button } from "../../ui/Button";
import { Input } from "../../ui/Input";
import { formatPhoneDisplay } from "../utils/phone";

export interface MerchantFormValues {
  cnpj: string;
  legal_name: string;
  trade_name: string;
  contact_email: string;
  phone: string;
}

interface MerchantFormProps {
  onSubmit: (values: MerchantFormValues) => Promise<void>;
  defaultValues?: Partial<MerchantFormValues>;
  isSubmitting?: boolean;
  serverErrors?: Record<string, string>;
  generalError?: string;
}

function formatCnpjDisplay(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 14);
  if (digits.length <= 2) return digits;
  if (digits.length <= 5) return `${digits.slice(0, 2)}.${digits.slice(2)}`;
  if (digits.length <= 8)
    return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5)}`;
  if (digits.length <= 12)
    return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8)}`;
  return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8, 12)}-${digits.slice(12, 14)}`;
}

export function MerchantForm({
  onSubmit,
  defaultValues = {},
  isSubmitting = false,
  serverErrors = {},
  generalError,
}: MerchantFormProps) {
  const {
    control,
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<MerchantFormValues>({
    defaultValues: {
      cnpj: "",
      legal_name: "",
      trade_name: "",
      contact_email: "",
      phone: "",
      ...defaultValues,
    },
  });

  const { field: cnpjField } = useController({
    control,
    name: "cnpj",
    rules: {
      required: "CNPJ é obrigatório",
      validate: (value) => {
        const digits = value.replace(/\D/g, "");
        if (digits.length !== 14) return "CNPJ deve ter 14 dígitos";
        return true;
      },
    },
  });

  const { field: phoneField } = useController({
    control,
    name: "phone",
  });

  async function handleFormSubmit(values: MerchantFormValues) {
    await onSubmit({
      ...values,
      cnpj: values.cnpj.replace(/\D/g, ""),
      phone: values.phone.replace(/\D/g, ""),
    });
  }

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
      {generalError && (
        <div className="rounded-md border border-red-200 bg-red-50 p-3">
          <p className="text-sm text-red-700">{generalError}</p>
        </div>
      )}
      <Input
        label="CNPJ"
        placeholder="00.000.000/0000-00"
        value={formatCnpjDisplay(cnpjField.value)}
        onChange={(e) => {
          const raw = e.target.value.replace(/\D/g, "").slice(0, 14);
          cnpjField.onChange(raw);
        }}
        onBlur={cnpjField.onBlur}
        ref={cnpjField.ref}
        error={errors.cnpj?.message || serverErrors.cnpj}
      />

      <Input
        label="Razão Social"
        error={errors.legal_name?.message || serverErrors.legal_name}
        {...register("legal_name", { required: "Razão social é obrigatória" })}
      />

      <Input
        label="Nome Fantasia"
        error={serverErrors.trade_name}
        {...register("trade_name")}
      />

      <Input
        label="E-mail"
        type="email"
        error={errors.contact_email?.message || serverErrors.contact_email}
        {...register("contact_email", {
          required: "E-mail é obrigatório",
        })}
      />

      <Input
        label="Telefone"
        placeholder="(11) 9123-4567"
        value={formatPhoneDisplay(phoneField.value)}
        onChange={(e) => {
          const raw = e.target.value.replace(/\D/g, "").slice(0, 11);
          phoneField.onChange(raw);
        }}
        onBlur={phoneField.onBlur}
        ref={phoneField.ref}
        error={serverErrors.phone}
      />

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Salvando..." : "Salvar"}
        </Button>
      </div>
    </form>
  );
}
