// Importa o módulo padrão 'amqplib' para habilitar a integração e comunicação com o servidor do RabbitMQ
import amqp from "amqplib";

// Define um alias de tipo local 'Connection' apontando para 'amqp.ChannelModel', que é a interface correta de Promises para conexões do amqplib
type Connection = amqp.ChannelModel;
// Define um alias de tipo local 'Channel' mapeando para 'amqp.Channel', que representa o canal de transmissão assíncrona de mensagens
type Channel = amqp.Channel;

// Declara e exporta a classe RabbitMQClient, responsável por gerenciar o ciclo de vida e operações de mensageria da infraestrutura
export class RabbitMQClient {
  // Declara uma propriedade privada para armazenar a conexão ativa, utilizando o modificador '!' para indicar inicialização tardia assegurada
  private connection!: Connection;
  // Declara uma propriedade privada para armazenar o canal aberto por onde trafegam os comandos e dados das filas
  private channel!: Channel;

  // O construtor recebe e armazena a string de conexão (URL) do RabbitMQ de forma pública e imutável
  constructor(private readonly url: string) {}

  // Método público e assíncrono encarregado de estabelecer a conexão física e lógica com o broker de mensageria
  public async connect(): Promise<void> {
    // Estabelece a conexão física com o servidor do RabbitMQ usando a URL armazenada e aguarda a resolução da Promise
    this.connection = await amqp.connect(this.url);
    // Cria um canal de comunicação multiplexado dentro da conexão ativa e aguarda a sua abertura estável
    this.channel = await this.connection.createChannel();
    // Assegura a existência da fila "career.skills.inject", configurando-a como 'durable' para que ela sobreviva a reinicializações do broker
    await this.channel.assertQueue("career.skills.inject", { durable: true });
  }

  // Método público e assíncrono utilizado para publicar payloads de mensagens de maneira direta em uma fila específica
  public async publish(queue: string, message: any): Promise<void> {
    // Envia a mensagem para a fila informada, convertendo o objeto JavaScript em uma string JSON e encapsulando-a em um Buffer binário
    this.channel.sendToQueue(queue, Buffer.from(JSON.stringify(message)), {
      // Configura a mensagem como persistente salvando-a em disco, garantindo que ela não seja perdida em caso de queda do RabbitMQ
      persistent: true,
    });
  }

  // Método público e assíncrono configurado para escutar uma fila e processar as mensagens recebidas através de um callback
  public async consume(
    queue: string, // Nome da fila que será monitorada pelo consumidor
    onMessage: (msg: any) => Promise<void>, // Função de callback assíncrona que dita o destino de negócio da mensagem extraída
  ): Promise<void> {
    // Ativa o ato de consumo na fila indicada e define a rotina assíncrona que será disparada para cada nova mensagem entregue pelo broker
    await this.channel.consume(queue, async (msg) => {
      // Verifica se a mensagem recebida é válida e diferente de nulo (mensagens nulas ocorrem quando o consumidor é cancelado pelo broker)
      if (msg !== null) {
        // Inicia um bloco de captura de erros para garantir a governança e tratamento adequado do processamento da fila
        try {
          // Converte o Buffer binário da mensagem em string e em seguida realiza o parse para transformá-lo novamente em um objeto JavaScript
          const content = JSON.parse(msg.content.toString());
          // Invoca o callback de negócio passando o objeto extraído e aguarda a conclusão completa da operação assíncrona
          await onMessage(content);
          // Confirma com sucesso a leitura para o broker (Acknowledge), removendo a mensagem da fila de forma definitiva
          this.channel.ack(msg);
        } catch (error) {
          // Captura qualquer falha que ocorra durante o parse ou durante a execução da função de negócio e exibe no terminal do servidor
          console.error("Falha no processamento da fila, rejeitando...", error);
          // Envia um sinal de rejeição (Negative Acknowledge) instruindo o RabbitMQ a não descartar a mensagem, mas sim reencaminhá-la ao topo da fila (requeue = true)
          this.channel.nack(msg, false, true);
        }
      }
    });
  }
}
