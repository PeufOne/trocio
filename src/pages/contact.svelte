<script>
    import Footer from 'Footer.svelte'

    const contactMail = 'info@trocio.ch'


</script>

<main>
    <br>
    <br>
    <h1 class="w3-center">Contact</h1>
    <br>
    <br>
    <div class="w3-center">
        <span>
            Envoyez-nous un mail à l'adresse
            <a href={`mailto:${contactMail}`}>
                <b>{contactMail}</b>
            </a>
        </span>
        <br><br>
        <span>
            Nous tâcherons de vous répondre aussi vite que possible, mais aussi lentement que nécessaire.
        </span>
    </div>
    
    
    <br><br><br>
</main>

<Footer/>

<style>
    main {
        min-height: 620px;
        max-width: 800px;
        margin: auto;
        text-align: justify;
    }
</style>
