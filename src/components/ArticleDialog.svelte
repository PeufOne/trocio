<script>
    import { onMount, createEventDispatcher } from 'svelte'
    const dispatch = createEventDispatcher()
    import { slide } from 'svelte/transition'

    import Dialog, { Title, Content, Actions } from '@smui/dialog'
    import MenuSurface from '@smui/menu-surface'
    import Button, { Label } from '@smui/button'
    import List, { Item, Graphic, Meta, Text, PrimaryText, SecondaryText} from '@smui/list'

    import { troc, user } from './stores'
    import notify from 'notify.js'
    import { formatPrice, getHeader, getFee, getMargin } from './utils'
    import SearchUser from './SearchUser.svelte'

    export let dialog
    export let article = {}

    let articleEdited = {}
    let isModified = false
    let editClientDialog
    let tarif = undefined
    let tarifPromise

    function onOpen() {
        isModified = false
        articleEdited = {}
        Object.assign(articleEdited, article)
        tarif = undefined
    }

    function acceptValidation() {
        articleEdited.valided = new Date()
        articleEdited.refused = undefined
        articleEdited.validator = {_id: $user._id, name: $user.name}
        testIsModifed()
    }

    function refuseValidation() {
        articleEdited.valided = undefined
        articleEdited.refused = new Date()
        articleEdited.validator = {_id: $user._id, name: $user.name}
        testIsModifed()
    }

    function sold() {
        articleEdited.sold = new Date()
        articleEdited.recover = undefined
        articleEdited.seller = {_id: $user._id, name: $user.name}
        testIsModifed()
    }

    function recover() {
        articleEdited.sold = undefined
        articleEdited.recover = new Date()
        articleEdited.seller = {_id: $user._id, name: $user.name}
        testIsModifed()
    }

    function removeValidation() {
        articleEdited.refused = undefined
        articleEdited.valided = undefined
        articleEdited.validator = undefined
        testIsModifed()
    }

    function removeSold() {
        articleEdited.sold = undefined
        articleEdited.recover = undefined
        articleEdited.seller = undefined
        articleEdited.buyer = undefined
        testIsModifed()
    }

    function openClientMenu() {
        editClientDialog.open()
    }

    function selectClient(e) {
        articleEdited.buyer = {_id: e.detail._id, name: e.detail.name}
        editClientDialog.close()
        testIsModifed()
    }

    function selectClientAnonyme() {
        articleEdited.buyer = undefined
        editClientDialog.close()
        testIsModifed()
    }

    function editName(e) {
        articleEdited.name = e.target.innerText
        testIsModifed()
    }

    function testIsModifed() {

        let edit = []
        Object.keys({...article, ...articleEdited}).forEach(key => {
            if (JSON.stringify(article[key]) !== JSON.stringify(articleEdited[key])) {
                edit.push({
                    key,
                    type: articleEdited[key] ? 'write' : 'erase',
                    value: articleEdited[key] && !!articleEdited[key]._id ? articleEdited[key]._id : articleEdited[key]
                })
            }
        })

        isModified = !!edit.length
        return edit
    }

    async function editPrice(e) {
        articleEdited.price = Number(e.target.value)
        if (!tarif) {
            tarifPromise = getTarif($troc._id, articleEdited.provider._id).then(updateFeeAndMargin)
        }else{
            updateFeeAndMargin()
        }
        testIsModifed()
    }

    function updateFeeAndMargin() {
        if (!!tarif) {
            articleEdited.fee = getFee(articleEdited, tarif)
            articleEdited.margin = getMargin(articleEdited, tarif)
        }
    }

    async function getTarif(trocId, userId) {
        try {
            let res = await fetch(`__API__/trocs/spec?troc=${trocId}&user=${userId}`)
            let json = await res.json()
            tarif = json.tarif
        } catch(error) {
            notify.error(error)
        }
    }
    
    async function valid() {

        let edits = testIsModifed()

        console.log({createEventDispatcher})

        try {
            let res = await fetch('__API__/articles/edit', getHeader({edits, article: article._id}))
            let json = await res.json()
            if (json.error) throw json.message
            notify.success('Modification enregistré')
            //article = articleEdited
            dispatch('edited', articleEdited)
        } catch(error) {
            notify.error(error)
        }

    }

</script>

<Dialog bind:this={editClientDialog} style="z-index: 8;">
    <Title>Définir le client</Title>
    <Content style="height: 400px; width: 300px; overflow-y: visible;">
        <SearchUser id="editArticle" placholder="Définir le client" on:select={selectClient}/>
        <br>
        <div class="w3-center">
            <Button on:click={selectClientAnonyme} variant="outlined" color="secondary">
                <i class="fas fa-user-secret w3-large"></i>&nbsp;Client anonyme 
            </Button>
        </div>
    </Content>
</Dialog>

<Dialog bind:this={dialog} on:MDCDialog:opening={onOpen} autoStackButtons="false" getEscapeKeyAction="false">
    <Title>
        <span>#{article.ref}</span>
        <div contenteditable="true" on:input={editName}>
            {articleEdited.name}
        </div>
    </Title>
    <Content style="min-width: 500px;">
        {#if article.newPriceRequest}
            <span class="w3-text-red">
                Une demande de changement de prix ({article.newPriceRequest.price.toFixed(2)}) est en cours... 
            </span>
        {/if}

        <List twoLine nonInteractive avatarList style="width: 320px;" class="w3-right">
            <Item>
                <Graphic>Proposé</Graphic>
                <Text>
                    <PrimaryText>Par {article.provider && article.provider.name}</PrimaryText>
                    <SecondaryText>Le {new Date(article.createdAt).toLocaleString()}</SecondaryText>
                </Text>
            </Item>

            {#if articleEdited.valided || articleEdited.refused}
                <Item>
                    <Graphic class={articleEdited.valided ? 'w3-text-blue' : 'w3-text-red'}>
                        {articleEdited.valided ? 'Validé' : 'Refusé'}
                    </Graphic>
                    <Text>
                        <PrimaryText>Par {articleEdited.validator.name}</PrimaryText>
                        <SecondaryText>Le {new Date(articleEdited.valided || articleEdited.refused).toLocaleString()}</SecondaryText>
                    </Text>

                    {#if !articleEdited.sold && !articleEdited.recover}
                        <Meta on:click={removeValidation} title={articleEdited.valided ? 'Annuler la validation' : 'Annuler le refus'}>
                            <i class="far fa-trash-alt w3-large button-icon"></i>
                        </Meta>
                    {/if}
                </Item>
            
            {/if}

            {#if articleEdited.valided}
                <Item>
                    {#if articleEdited.sold}
                        <Graphic class="w3-text-green">Vendu</Graphic>
                        <Text>
                            <PrimaryText>
                                Par {articleEdited.seller.name}<br>
                                <span on:click={() => editClientDialog.open()} class="clickable" title="Définir le client">
                                    à {@html articleEdited.buyer && articleEdited.buyer.name || 'un client anonyme <i class="fas fa-user-secret w3-opacity"></i>'}
                                </span>
                            </PrimaryText>
                            <SecondaryText>Le {new Date(articleEdited.sold).toLocaleString()}</SecondaryText>
                        </Text>
                        
                        <Meta on:click={removeSold} title="Annuler la vente">
                            <i class="far fa-trash-alt w3-large button-icon"></i>
                        </Meta>
                        
                    {:else if articleEdited.recover}
                        <Graphic class="w3-text-orange">Rendu</Graphic>
                        <Text>
                            <PrimaryText>Par {articleEdited.seller.name}</PrimaryText>
                            <SecondaryText>Le {new Date(articleEdited.recover).toLocaleString()}</SecondaryText>
                        </Text>
                        <Meta on:click={removeSold} title="Annuler la récupération">
                            <i class="far fa-trash-alt w3-large button-icon"></i>
                        </Meta>
                        
                    {:else}
                        <Graphic>Caisse</Graphic>
                        <Button on:click={recover} color="secondary" title="Rendre l'article à son propriétaire">
                            <Label><i class="fas fa-undo"></i> Rendre</Label>
                        </Button>
                        <Button on:click={sold} title="Vendre l'article à un client">
                            <Label><i class="fas fa-shopping-cart"></i> Vendre</Label>
                        </Button>

                    {/if}
                </Item>

            {:else if !articleEdited.refused}
                <Item>
                    <Graphic>Validation</Graphic>
                    <Button on:click={refuseValidation} color="secondary" title="Refusé l'article proposé">
                        <Label><i class="fa fa-times"></i> Refuser</Label>
                    </Button>
                    <Button on:click={acceptValidation} title="Accepter l'article proposé">
                        <Label><i class="fa fa-check"></i> Valider</Label>
                    </Button>
                </Item>
            {/if}

        </List>

        <div>

            <br>
            <span>
                Prix: 
                <input
                    value={articleEdited.price}
                    use:formatPrice
                    on:input={editPrice}
                    style="width: 80px;">
            </span><br>

            {#await tarifPromise}
                <i class="fas fa-spinner w3-spin"></i>
                <span>...tarif</span>
            {:then}
                <span>Frais: {articleEdited.fee && articleEdited.fee.toFixed(2)}</span><br>
                <span>Marge: {articleEdited.margin && articleEdited.margin.toFixed(2)}</span><br>
            {/await}
            
        </div>

    </Content>
    
    {#if isModified}
        <div transition:slide>
            <Actions>
                <Button color="secondary">
                    <Label><i class="fa fa-times"></i> Annuler</Label>
                </Button>
                <Button on:click={valid}>
                    <Label><i class="fa fa-check"></i> Sauvegarder</Label>
                </Button>
            </Actions>
        </div>
    {/if}

</Dialog>

<style>

    input {
        border: none;
    }

</style>