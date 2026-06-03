// Importa o tipo do caso de uso RefineDraftUseCase para realizar a tipagem estática da dependência injetada
import type { RefineDraftUseCase } from "@/application/refinement/use-cases/refine-draft.use-case.js";
// Importa os tipos explícitos Request e Response do Express para tipar os parâmetros do ciclo HTTP
import { type Request, type Response } from "express";

// Declara e exporta a classe controladora responsável por receber requisições HTTP e direcioná-las ao caso de uso
export class RefineNoteController {
  // O construtor recebe e armazena privadamente a instância do caso de uso necessária para processar a ação (Injeção de Dependência)
  constructor(private readonly refineDraftUseCase: RefineDraftUseCase) {}

  // Define o método 'handle' usando uma arrow function assíncrona para preservar o escopo do 'this' automaticamente ao ser chamado pelo Express
  public handle = async (req: Request, res: Response): Promise<void> => {
    // Inicia um bloco de captura de erros para tratar exceções lançadas pelas camadas internas (Caso de Uso/Domínio)
    try {
      // Realiza a desestruturação do corpo da requisição HTTP para extrair os campos primitivos esperados
      const { scope, raw_content } = req.body;

      // Verifica se o campo 'scope' OU o campo 'raw_content' não foram enviados ou estão vazios
      if (!scope || !raw_content) {
        // Responde imediatamente ao cliente com o status HTTP 400 (Bad Request) e encerra o fluxo enviando um JSON explicativo
        res
          .status(400)
          .json({ error: "Payload incompleto. Requer scope e raw_content." });
        return; // Interrompe a execução da função para evitar o processamento do caso de uso
      }

      // Invoca assincronamente o caso de uso passando as propriedades no formato esperado pelo DTO de entrada
      const output = await this.refineDraftUseCase.execute({
        scope,
        rawContent: raw_content, // Mapeia o snake_case do HTTP para o camelCase do caso de uso
      });

      // Retorna o status HTTP 200 (OK) para o cliente enviando o resultado em formato JSON formatado em snake_case
      res.status(200).json({
        refined_content: output.refinedContent,
        suggested_filename: output.suggestedFilename,
      });
    } catch (error: any) {
      // Captura qualquer erro de negócio/validação lançado e responde com status HTTP 422 (Unprocessable Entity) contendo a mensagem de erro
      res.status(422).json({ error: error.message });
    }
  };
}
