<script>
    import { onMount, createEventDispatcher } from 'svelte'
    import { flip } from 'svelte/animate'
    import { crossfade } from 'svelte/transition'
    const dispatch = createEventDispatcher()

    import { params } from '@sveltech/routify'
    import Button from '@smui/button'
    import Textfield from '@smui/textfield'
    import Dialog , { Title, Content } from '@smui/dialog'

    import dayjs from 'dayjs'
	import relativeTime from 'dayjs/plugin/relativeTime'
	import 'dayjs/locale/fr'
	dayjs.locale('fr')
    dayjs.extend(relativeTime)

    import { user, troc, trocDetails as details, cashierOptions} from './stores'
    import { getHeader, crossfadeConfig, sortByUpdatedAt, goPrint, formatPrice, addStatutField} from './utils.js'
    import notify from './notify.js'
    import TagsPrint from './TagsPrint.svelte'
    import Article from './Article.svelte'

    let proposed = []
    $: proposed = $details ? $details.provided.filter(art => !art.valided) : []
    

    let validPromise //Valid button
	let nbNewArticles = 0
	let newArticle = {name: '', price: ''}

    const [send, receive] = crossfade(crossfadeConfig)
    
    const LIMIT_LIST_INIT = 5 //Nombre d'élément d'une liste afficher initialement
    let LIMIT_LIST_A = LIMIT_LIST_INIT //Nombre d'élément afficher pour la premier liste
    let LIMIT_LIST_B = LIMIT_LIST_INIT //Nombre d'élément afficher pour la seconde liste

    const proposedFilter = art => !art.recover && !art.sold && art.isRemovable

    let articlesValided = []
    let articlesPrinted = []

    function removeArticle(artId) {
        let index = $details.provided.map(a => a._id).indexOf(artId)
        if(index > -1) {
            $details.provided[index].valided = undefined
            $details.provided[index].isRemovable = false
            nbNewArticles--
        }
    }

    function clickProposedArticle(artId) {
        console.log('Click YOLO')
        let index = $details.provided.map(a => a._id).indexOf(artId)
        if (index > -1) {
            $details.provided[index].valided = new Date()
            $details.provided[index].updatedAt = new Date()
            $details.provided[index].isRemovable = true
            nbNewArticles++
        }
    }

    function clickProposedArticleAll() {
        proposed.forEach(art => clickProposedArticle(art._id))
    }

    async function validProvided() {

        let date = new Date()
        articlesValided = $details.provided.filter(art => !art.recover && !art.sold && art.isRemovable)
        articlesValided.forEach(art => art.valided = date)
        articlesPrinted = articlesValided
        
        try {
            let res = await fetch('__API__/articles', getHeader(articlesValided, 'PATCH'))
            let json = await res.json()
            if (res.ok && json.success) {
    
                //Update details
                let articlespatched = json.message
                let sumFee = 0
                articlespatched.forEach(article => {
                    let index = $details.provided.map(art => art._id).indexOf(article._id)
                    if (index > -1) {
                        $details.provided[index].valided = article.valided
                        $details.provided[index].fee = article.fee
                        delete $details.provided[index].isRemovable
                        $details.provided[index] = addStatutField($details.provided[index])
                        sumFee += article.fee
                    } else {
                        notify.error(`L'article mis à jour ne correspond pas à un de vos articles !`)
                    }
                })
     
                $details.feeSum -= sumFee
                $details.balance -= sumFee
    
                nbNewArticles -= articlesValided.length
    
                notify.success(articlespatched.length > 1 ? `${articlespatched.length} articles validés`: `Article validé`)
    
                //Impression des étiquettes
                if ($cashierOptions.autoPrintTag) setTimeout(() => goPrint('providedTags'), 100)
                
                return
            }
        } catch(error) {
			console.trace(error)
		}
    }

    function printArticles(articles) {
        articlesPrinted = articles
        setTimeout(() => goPrint('providedTags'), 100)
    }

    function openCreateDialog() {
        dispatch('openCreateDialog')
    }

</script>

{#if $troc && $troc.tag}
    <TagsPrint id="providedTags" articles={articlesPrinted} {...$troc.tag}/>
{/if}

<div class="w3-row">

    <div class="w3-col m6">
        <div class="w3-margin-right">

            {#if proposed.length}
                <Button on:click={clickProposedArticleAll} class="w3-right" variant="outlined" color="secondary">
                    Tout accepter
                </Button>
            {/if}

            <Button on:click={openCreateDialog} class="w3-right w3-margin-right" variant="outlined" color="secondary">
                Ajouter
            </Button>

            <h4>Proposés</h4>
            {#each proposed.sort(sortByUpdatedAt).slice(0, LIMIT_LIST_A) as article (article._id)}
                <div in:receive|local="{{key: article._id}}" out:send|local="{{key: article._id}}" animate:flip="{{duration: 200}}">

                    <Article article={article} clickable={!article.refused} on:select="{() => clickProposedArticle(article._id)}"/>

                </div>
            {:else}
                <span class="w3-opacity">Pas d'articles proposés !</span>
            {/each}

            <!-- Bouton pour prolongé la liste -->
            {#if proposed.length > LIMIT_LIST_A}
                <div on:click="{() => LIMIT_LIST_A += 25}" class="underline-div w3-center">
                    <span class="underline-span w3-opacity">
                        Afficher plus d'éléments ({proposed.length - LIMIT_LIST_A})
                    </span>
                </div>
            {/if}

        </div>
    </div>

    <div class="w3-col m6">
        <div class="w3-margin-left">

            {#await validPromise}
                <Button variant="raised" class="w3-right" style="color: white;">
                    <i class="fas fa-circle-notch w3-spin"></i>
                    Validation de la livraison...
                </Button>
            {:then}
                {#if nbNewArticles > 0}
                    <Button variant="raised" class="w3-right" on:click="{() => validPromise = validProvided()}" style="color: white;">
                        Valider l{nbNewArticles <= 1 ? `'article fourni` : `es ${nbNewArticles} articles fournis`}
                    </Button>
                {/if}
            {/await}

            <h4>En vente</h4>

            {#each $details.provided.filter(art => art.valided && !art.sold && !art.recover)
                    .sort(sortByUpdatedAt)
                    .slice(0, LIMIT_LIST_B) as article (article._id)}

                <div in:receive|local="{{key: article._id}}" out:send|local="{{key: article._id}}" animate:flip="{{duration: 200}}">

                    <Article
                    article={article}
                    timeKey={'validTime'}
                    on:remove={() => removeArticle(article._id)}
                    printable on:print={() => printArticles([article])}/>

                </div>
            {:else}
                <span class="w3-opacity">Pas d'articles fournis en magasin !</span>
            {/each}

            <!-- Bouton pour prolongé la liste -->
            {#if $details.provided.filter(art => art.valided && !art.sold && !art.recover).length > LIMIT_LIST_B}
                <div on:click="{() => LIMIT_LIST_B += 25}" class="underline-div w3-center">
                    <span class="underline-span w3-opacity">
                        Afficher plus d'éléments ({$details.provided.filter(art => art.valided && !art.sold && !art.recover).length - LIMIT_LIST_B})
                    </span>
                </div>
            {/if}

        </div>
    </div>
</div>

