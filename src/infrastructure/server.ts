import { app } from "./app.js";

const PORT = 3000;

app.listen(PORT, () => {
  console.log(`Servidor HTTP rodando com sucesso na porta ${PORT}!`);
});
