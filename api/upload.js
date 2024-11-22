const { google } = require('googleapis');
const formidable = require('formidable-serverless');
const fs = require('fs');

// Configuração da conta de serviço
const KEYFILEPATH = './service-account.json'; // Certifique-se de incluir o arquivo na pasta raiz do projeto
const SCOPES = ['https://www.googleapis.com/auth/drive.file'];
const auth = new google.auth.GoogleAuth({
    keyFile: KEYFILEPATH,
    scopes: SCOPES,
});
const drive = google.drive({ version: 'v3', auth });

// ID da pasta no Google Drive
const FOLDER_ID = '1f1sP_9Up6EU-aSJIMMrFanxbBd4nlL21';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).send({ message: 'Método não permitido' });
    }

    const form = new formidable.IncomingForm();
    form.parse(req, async (err, fields, files) => {
        if (err) {
            console.error('Erro ao processar formulário:', err);
            return res.status(500).send({ success: false, error: 'Erro ao processar o formulário.' });
        }

        try {
            const { nome, cor, tipo, obs1, areas } = fields;
            const numeroPedido = Date.now();

            const pedidoContent = `
Número do Pedido: ${numeroPedido}
Nome do Cliente: ${nome}
Cor do Tecido: ${cor}
Áreas a serem estampadas: ${areas}
Tipo de Camiseta: ${tipo}
Observação: ${obs1}
            `.trim();

            const pedidoMetadata = {
                name: `Pedido_${numeroPedido}_${nome}.txt`,
                parents: [FOLDER_ID],
            };

            const pedidoMedia = {
                mimeType: 'text/plain',
                body: pedidoContent,
            };

            const pedidoResponse = await drive.files.create({
                resource: pedidoMetadata,
                media: pedidoMedia,
                fields: 'id',
            });

            let anexoLink = '';
            if (files.anexo) {
                const anexoMetadata = {
                    name: files.anexo.name,
                    parents: [FOLDER_ID],
                };

                const anexoMedia = {
                    mimeType: files.anexo.type,
                    body: fs.createReadStream(files.anexo.path),
                };

                const anexoResponse = await drive.files.create({
                    resource: anexoMetadata,
                    media: anexoMedia,
                    fields: 'id',
                });

                await drive.permissions.create({
                    fileId: anexoResponse.data.id,
                    requestBody: { role: 'reader', type: 'anyone' },
                });
                anexoLink = `https://drive.google.com/uc?id=${anexoResponse.data.id}&export=download`;
            }

            const mensagem = `
*Pedido de Camiseta*\n
*Número do Pedido:* ${numeroPedido}\n
*Nome do Cliente:* ${nome}\n
*Cor do Tecido:* ${cor}\n
*Áreas a serem estampadas:* ${areas}\n
*Tipo de Camiseta:* ${tipo}\n
*Observação:* ${obs1}\n
${anexoLink ? `*Arquivo em anexo:* ${anexoLink}` : ''}
            `.trim();

            res.status(200).json({ success: true, mensagem });
        } catch (error) {
            console.error('Erro ao enviar pedido:', error);
            res.status(500).send({ success: false, error: 'Erro ao enviar o pedido.' });
        }
    });
}
