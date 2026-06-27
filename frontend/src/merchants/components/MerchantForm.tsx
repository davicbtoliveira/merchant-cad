import { useForm, useController } from "react-hook-form";
import { Button } from "../../ui/Button";
import { Input } from "../../ui/Input";
import { formatCnpjDisplay, isValidCnpj, normalizeCnpjInput } from "../utils/cnpj";
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
        const cnpj = normalizeCnpjInput(value);
        if (cnpj.length !== 14) return "CNPJ deve ter 14 caracteres";
        if (!/^\d{2}$/.test(cnpj.slice(12, 14))) {
          return "Dígitos verificadores do CNPJ devem ser numéricos";
        }
        if (!isValidCnpj(cnpj)) return "CNPJ inválido";
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
      cnpj: normalizeCnpjInput(values.cnpj),
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
          cnpjField.onChange(normalizeCnpjInput(e.target.value));
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
