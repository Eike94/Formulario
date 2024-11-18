import emailjs from '@emailjs/browser';

emailjs.init("user_LclK2Irer3tFyNCua"); // Substitua pelo seu ID de usuário do EmailJS

async function enviarFormulario() {
    const form = document.getElementById("pedidoForm");

    const formData = new FormData(form);

    // Envia o e-mail usando o EmailJS
    emailjs.sendForm('service_lyco9nm', 'template_h7cjlj4', formData, 'user_LclK2Irer3tFyNCua')
        .then((response) => {
            alert("Pedido enviado com sucesso!");
        }, (error) => {
            console.error("Erro ao enviar:", error);
            alert("Erro ao enviar o pedido. Tente novamente.");
        });
}

