<template>
  <v-card class="mx-auto" max-width="344" outlined>
    <v-card-title class="headline">
      {{ document.name }}
    </v-card-title>
    <v-card-actions>
      <v-btn text nuxt :to="`/documents/${document.id}`">
        {{ $t('view') }}
      </v-btn>
    </v-card-actions>
  </v-card>
</template>

<script lang="ts">
import { DocumentListItem } from 'api-client'
import { Vue, Component, Prop } from 'nuxt-property-decorator'

@Component
export default class DocumentCard extends Vue {
  @Prop({ required: true }) document!: DocumentListItem
}
</script>

<style scoped lang="scss"></style>