import { defineComponent, ref, computed, toRefs, VNode } from 'vue'
import { debounce } from 'lodash'
import { Actions } from '../sage'
import { uesModuleStore } from '@/hooks/index'
import { NAMESPACED, State } from '../module'
import { FooterNameSpaced } from '@/modules/index'
import {
  State as FooterState,
  Actions as FooterActions,
  Mutations as FooterMutations
} from '@/pages/footer/module'
import './search.less'

interface Context {
  default: () => VNode
}

const Option = defineComponent({
  name: 'Option',
  props: ['value', 'onSelect'],
  setup(props, context) {
    const { value, onSelect } = toRefs(props)
    const handleSelect = () => {
      onSelect?.value(value?.value)
    }
    return () => (
      <li onClick={handleSelect}>
        {((context.slots as unknown) as Context).default()}
      </li>
    )
  }
})

export const Search = defineComponent({
  name: 'Search',
  components: {
    Option
  },
  setup() {
    const { useActions, useState } = uesModuleStore<State>(NAMESPACED)
    const footerStore = uesModuleStore<FooterState>(FooterNameSpaced)

    const words = ref('')
    const loading = ref(false)

    const source = computed(() => {
      const { searchSuggest } = useState()
      return searchSuggest.order || []
    })

    const handleSearch = debounce(async () => {
      if (words.value) {
        loading.value = true
        await useActions(Actions.GET_SEARCH_SUGGEST, words.value)
        loading.value = false
      }
      const { searchSuggest } = useState()
      console.log(searchSuggest)
    }, 200)

    const handleSelect = async (v: number) => {
      console.log(v)
      await footerStore.useActions(FooterActions.SET_MUSIC, v)
      footerStore.useMutations(FooterMutations.PLAY_MUSIC)
    }

    const { searchSuggest } = toRefs(useState())
    const Slot = {
      popper: () => (
        <div class="search-popper">
          <div class="search-popper-title" v-show={searchSuggest.value.songs}>
            <icon icon="facebook" color="#333" size={14}></icon>单曲
          </div>
          <ul class="search-popper-group">
            {searchSuggest.value.songs?.map(song => {
              return (
                <Option value={song.id} onSelect={handleSelect}>
                  {song.name} -{' '}
                  {song.artists.map(artist => artist.name).join(' ')}
                </Option>
              )
            })}
          </ul>
          <div class="search-popper-title" v-show={searchSuggest.value.artists}>
            <icon icon="facebook" color="#333" size={14}></icon>歌手
          </div>
          <ul class="search-popper-group">
            {searchSuggest.value.artists?.map(artist => {
              return (
                <Option value={artist.id} onSelect={handleSelect}>
                  {artist.name}
                </Option>
              )
            })}
          </ul>
          <div class="search-popper-title" v-show={searchSuggest.value.albums}>
            <icon icon="facebook" color="#333" size={14}></icon>专辑
          </div>
          <ul class="search-popper-group search-popper-last">
            {searchSuggest.value.albums?.map(album => {
              return (
                <Option value={album.id} onSelect={handleSelect}>
                  {album.name} - {album.artist.name}
                </Option>
              )
            })}
          </ul>
        </div>
      )
    }
    return () => (
      <div class="search">
        <ve-auto-complete
          class="search-input"
          type="search"
          size="small"
          v-model={[words.value, 'value']}
          data-source={source.value}
          onCompositionEnd={handleSearch}
          loading={loading.value}
          v-slots={Slot}
        ></ve-auto-complete>
      </div>
    )
  }
})