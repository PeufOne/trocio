
<script>
    import { createEventDispatcher } from 'svelte'
    import { slide } from 'svelte/transition'
    import List, { Item, Text } from '@smui/list'

    export let count = 0
    export let title = ''
    export let sum = 0
    export let free = false
    export let show = false
    export let items = []
    export let nonInteractive = false

    let dispatch = createEventDispatcher()

    function clickHandler(e) {
        if (!e.target.classList.contains('clickHandler')) return
        show = !show
        if (show) dispatch('open')
        else dispatch('close')
    }

</script>

<div class="simple-card clickable">

    <div on:click={clickHandler} class="clickable w3-row header clickHandler">
        <div class="w3-col s1 w3-right-align w3-large clickHandler" style="padding-right: 20px;">{count}</div>
        <div class="w3-col s9 w3-large clickHandler">
            <i class="fas fa-chevron-right w3-opacity clickHandler" class:show></i>
            &nbsp;{title}
            
            <slot name="head"></slot>
           
        </div>
        <span class="w3-col s2 w3-right-align w3-large clickHandler">{sum.toFixed(2)}</span>
    </div>

    {#if show}
        <div transition:slide|local>
            {#if free}

                <slot></slot>

            {:else if !items.length}

                <div class="w3-center w3-padding w3-opacity">
                    Aucun élément
                </div>

            {:else if items.length}

                <List style="padding: 7px;" {nonInteractive}>
                    {#each items as item}
                        <Item style="padding: 0 6px">
                            <Text class="w3-col s1"><slot name="col-1" {item}></slot></Text>
                            <Text class="w3-col s8"><slot name="col-2" {item}></slot></Text>
                            <Text class="w3-col s3 w3-right-align"><slot name="col-3" {item}></slot></Text>
                        </Item>
                    {/each}
                </List>

            {/if}
        </div>
    {/if}
    

</div>

<style>

    .header {
        padding: 15px 7px;
        line-height: 32px; 
    }

    .fa-chevron-right {
        transition: .2s;
    }

    .fa-chevron-right.show {
        transform: rotate(90deg);
    }

</style>

