export interface CustomValidationError {
  code: string;
  path: (string | number)[];
  type?: string;
  minimum?: number;
  expected?: string;
  received?: string;
}

export interface ErrorMapContext {
  defaultError: string;
}

const REQUIRED_MESSAGES: Record<string, string> = {
  title: "O título provisório da nota é obrigatório.",
  flow_id: "O ID do fluxo operacional é obrigatório.",
  raw_content: "O conteúdo bruto do rascunho é obrigatório.",
};

const INVALID_NUMBER_MESSAGES: Record<string, string> = {
  id: "O ID informado deve ser um número positivo válido.",
  flow_id: "O ID do fluxo informado deve ser um número válido.",
};

function handleInvalidType(issue: CustomValidationError): string {
  const path = issue.path?.join(".") || "";

  const isMissing =
    issue.received === "undefined" ||
    !issue.received ||
    issue.received === "null";

  if (isMissing) {
    return REQUIRED_MESSAGES[path] ?? "Este campo é obrigatório.";
  }

  if (path === "id" || path === "flow_id") {
    return INVALID_NUMBER_MESSAGES[path];
  }

  return `Esperava o tipo ${issue.expected || "válido"}, mas recebeu ${issue.received}.`;
}

function handleTooSmall(issue: CustomValidationError): string {
  if (issue.type === "string") {
    return issue.minimum === 1
      ? "Este campo não pode ser enviado vazio."
      : `O tamanho mínimo exigido é de ${issue.minimum} caracteres.`;
  }
  return `O valor mínimo permitido é ${issue.minimum}.`;
}

export const errorMap = (
  issue: CustomValidationError,
  ctx: ErrorMapContext,
): { message: string } => {
  switch (issue.code) {
    case "invalid_type":
      return { message: handleInvalidType(issue) };
    case "too_small":
      return { message: handleTooSmall(issue) };
    default:
      return {
        message: ctx?.defaultError || "Dados inválidos para o contrato da API.",
      };
  }
};
