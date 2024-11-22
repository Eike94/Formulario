const express = require('express');
const multer = require('multer');
const { google } = require('googleapis');
const fs = require('fs');

const app = express();
const upload = multer({ dest: 'uploads/' });

// Configuração da conta de serviço
const KEYFILEPATH = 'path/to/service-account.json'; // Substitua pelo caminho do arquivo JSON
const SCOPES = ['https://www.googleapis.com/auth/drive.file'];

const auth = new google.auth.GoogleAuth({
    keyFile: KEYFILEPATH,
    scopes: SCOPES,
});

const drive = google.drive({ version: 'v3', auth });

// Endpoint para upload
app.post('/upload', upload.single('anexo'), async (req, res) => {
    try {
        const { nome, cor, tipo, obs1, areas } = req.body;

        // Número do pedido
        const numeroPedido = Date.now(); // Pode usar lógica mais robusta para número único

        // Criar arquivo de texto do pedido
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
            parents: ['1f1sP_9Up6EU-aSJIMMrFanxbBd4nlL21'], // ID da pasta
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
        if (req.file) {
            const anexoMetadata = {
                name: req.file.originalname,
                parents: ['1f1sP_9Up6EU-aSJIMMrFanxbBd4nlL21'],
            };

            const anexoMedia = {
                mimeType: req.file.mimetype,
                body: fs.createReadStream(req.file.path),
            };

            const anexoResponse = await drive.files.create({
                resource: anexoMetadata,
                media: anexoMedia,
                fields: 'id',
            });

            // Criar link público
            await drive.permissions.create({
                fileId: anexoResponse.data.id,
                requestBody: {
                    role: 'reader',
                    type: 'anyone',
                },
            });
            anexoLink = `https://drive.google.com/uc?id=${anexoResponse.data.id}&export=download`;
            fs.unlinkSync(req.file.path);
        }

        res.status(200).json({
            success: true,
            numeroPedido,
            nome,
            cor,
            tipo,
            obs1,
            areas,
            anexoLink,
        });
    } catch (error) {
        console.error('Erro ao enviar arquivo:', error);
        res.status(500).send({ success: false, error: 'Erro ao enviar o pedido.' });
    }
});

app.listen(3000, () => console.log('Servidor rodando em http://localhost:3000'));
