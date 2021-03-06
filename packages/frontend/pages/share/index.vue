<template>
  <v-window
    v-model="step"
    :class="{ 'pt-12': $vuetify.breakpoint.smAndUp }"
    :touch="onSwipe"
  >
    <AppBar :empty="$vuetify.breakpoint.xs" :title="toolbarTitle">
      <template v-if="$vuetify.breakpoint.xs" v-slot:nav-action>
        <BackButton v-show="step === 0" tabindex="0" class="mt-1" />
        <v-btn
          v-show="step > 0"
          icon
          :title="`${$t('navigation.back')}`"
          class="a11y-focus mt-1"
          tabindex="0"
          @click="prev"
        >
          <v-icon small class="mr-2">$chevron-left</v-icon>
        </v-btn>
      </template>
      <template v-if="$vuetify.breakpoint.xs" v-slot:actions>
        <v-btn
          color="primary"
          class="body-1"
          :disabled="isNextDisabled"
          @click="next"
        >
          {{ $t(step === 2 ? 'controls.done' : 'controls.next') }}
        </v-btn>
      </template>
      <template v-else-if="$vuetify.breakpoint.smAndUp" v-slot:actionsBeneath>
        <v-btn
          text
          :title="`${$t('navigation.back')}`"
          class="a11y-focus body-1 mx-2"
          tabindex="0"
          @click="prevOrBack"
        >
          <v-icon small>$arrow-left</v-icon>
          <span class="px-2 grey-8--text">{{ $t('navigation.back') }}</span>
        </v-btn>
        <v-btn
          color="primary"
          class="body-1 my-2"
          :disabled="isNextDisabled"
          @click="next"
        >
          {{ $t(step === 2 ? 'controls.done' : 'controls.next') }}
        </v-btn>
      </template>
    </AppBar>
    <v-window-item
      :class="[{ mobile: $vuetify.breakpoint.xs }, 'blue-super-light']"
    >
      <div class="window-container pt-3">
        <DocumentList
          v-model="selectedDocs"
          :selectable="true"
          :pre-selected="preSelected"
          :show-actions="false"
          class="mx-8"
        />
      </div>
    </v-window-item>
    <v-window-item
      :class="[{ mobile: $vuetify.breakpoint.xs }]"
      style="min-height: 100%"
    >
      <div class="d-flex flex-column" style="min-height: calc(100vh - 88px)">
        <div
          class="window-container px-8 pt-8 mb-2 flex-grow-1"
          style="max-width: 564px; width: 100%"
        >
          <v-row>
            <v-col cols="auto" class="pr-0">
              <v-icon v-if="true" class="mb-2">$profile</v-icon>
            </v-col>
            <v-col class="font-weight-medium">
              {{ $t('sharing.recipients') }}
            </v-col>
          </v-row>
          <ValidationObserver ref="observer">
            <v-form @submit.prevent>
              <ValidationProvider
                v-slot="{ errors }"
                mode="aggressive"
                name="email"
                :rules="emailValidationRules"
              >
                <v-text-field
                  v-model="email"
                  :error-messages="
                    individualEmailAddresses.length >= 10
                      ? [$tc('sharing.tooManyRecipients', 10)]
                      : errors
                  "
                  outlined
                  :placeholder="$t('sharing.addRecipientPlaceholder')"
                  type="email"
                  :disabled="individualEmailAddresses.length >= 10"
                  @keydown.enter="addEmail"
                  @blur="addEmail"
                />
              </ValidationProvider>
            </v-form>
          </ValidationObserver>
          <v-card
            v-for="(email, i) in individualEmailAddresses"
            :key="i"
            rounded
            class="invitee px-4 py-1 mb-2 grey-2"
          >
            <v-row align="center" no-gutters>
              <v-col>
                <span>{{ email }}</span>
              </v-col>
              <v-col cols="auto">
                <v-btn
                  :title="`${$t('navigation.close')}`"
                  icon
                  @click="removeEmail(i)"
                >
                  <v-icon>$close</v-icon>
                </v-btn>
              </v-col>
            </v-row>
          </v-card>
        </div>
        <FooterCard
          class="d-flex align-self-end mx-auto"
          title="sharing.disclaimerTitle"
          :body="
            $t('sharing.shareDocumentDisclaimer', {
              emails: !!domainsList ? domainsList : [],
            })
          "
        />
      </div>
    </v-window-item>
    <v-window-item>
      <div class="window-container px-8 pt-12 d-flex justify-center">
        <div>
          <p class="font-weight-bold pt-4">
            {{ $tc('sharing.confirmSharedFiles', selectedDocs.length) }}
          </p>
          <v-card
            v-for="(doc, i) in selectedDocs.slice(0, sliceFiles)"
            :key="`file-${i}`"
            rounded
            class="invitee px-4 py-4 mb-2 grey-2"
          >
            <v-row align="center" no-gutters>
              <v-col class="pr-4" cols="auto">
                <v-icon>$document</v-icon>
              </v-col>
              <v-col>
                <span>{{ doc.name }}</span>
              </v-col>
            </v-row>
          </v-card>
          <v-btn
            v-if="selectedDocs.length > sliceFiles"
            class="float-right"
            text
            @click="sliceFiles = 100"
          >
            {{ $tc('sharing.plusNMore', selectedDocs.length - sliceFiles) }}
          </v-btn>
          <p class="font-weight-bold pt-8">
            {{
              $tc(
                'sharing.confirmRecipientsLabel',
                individualEmailAddresses.length,
              )
            }}
          </p>
          <v-card
            v-for="(email, i) in individualEmailAddresses.slice(
              0,
              sliceRecipients,
            )"
            :key="`recipient-${i}`"
            rounded
            class="invitee px-4 py-4 mb-2 d-flex grey-2"
          >
            <v-row align="center" no-gutters>
              <v-col class="pr-4" cols="auto">
                <v-icon>$profile</v-icon>
              </v-col>
              <v-col>
                <span>{{ email }}</span>
              </v-col>
            </v-row>
          </v-card>
          <v-btn
            v-if="individualEmailAddresses.length > sliceRecipients"
            class="float-right"
            text
            @click="sliceRecipients = 10"
          >
            {{
              $tc(
                'sharing.plusNMore',
                individualEmailAddresses.length - sliceRecipients,
              )
            }}
          </v-btn>
        </div>
      </div>
    </v-window-item>
    <FooterLinks />
  </v-window>
</template>

<script lang="ts">
import { Vue, Component, Watch } from 'nuxt-property-decorator'
import { validate, ValidationObserver, ValidationProvider } from 'vee-validate'

import { Document } from 'api-client'
import SnackParams from '@/types/snackbar'
import { RawLocation } from 'vue-router'
import { VeeObserver } from 'vee-validate/dist/types/types'
import { ValidationContext } from 'vee-validate/dist/types/components/common'
import { snackbarStore, userStore } from '@/plugins/store-accessor'
import { format } from 'date-fns'

@Component({
  layout: 'empty',
  components: {
    ValidationObserver,
    ValidationProvider,
  },
  head() {
    return {
      title: this.$t('controls.share') as string,
    }
  },
})
export default class Share extends Vue {
  selectedDocs: Document[] = []
  individualEmailAddresses: string[] = []

  step = 0
  length = 3

  email = ''
  recompute = false
  isLoading = false
  name = ''
  sliceFiles = 5
  sliceRecipients = 5
  emailValidationRules = ''

  async mounted() {
    const collections = await this.$store.dispatch('user/getCollections')
    this.name = this.$t('sharing.defaultName', {
      date: format(Date.now(), 'LLL d, yyyy - k:mm'),
    }) as string

    // we wait until mounted to assign this since jest cannot mock $config
    // until the component is mounted
    this.emailValidationRules = `email|emailWhitelist:${this.$config.agencyEmailDomainsWhitelist}`
  }

  next() {
    if (this.step < this.length - 1) {
      this.step += 1
    } else {
      this.submit()
    }
  }

  prev() {
    this.step -= this.step > 0 ? 1 : 0
    ;(this.$refs.observer as any).reset()
  }

  prevOrBack() {
    if (this.step === 0) {
      if (window.history.length) {
        this.$router.back()
      } else {
        this.$router.push(this.localePath('/dashboard'))
      }
    } else {
      this.prev()
    }
  }

  onSwipe = {
    left: this.prev,
    right: this.isNextDisabled ? () => {} : this.next,
  }

  get domainsList() {
    const devCityList = ['@newamerica.org', '@twobulls.com']
    const domains = this.$config.agencyEmailDomainsWhitelist
      .split(',')
      .filter(
        (item: String) =>
          item !== '@newamerica.org' && item !== '@twobulls.com',
      )
    const list = domains.length ? domains : devCityList
    return `${list.slice(0, -1).join('; ')} ${list.length > 1 ? 'and ' : ''}${
      list[list.length - 1]
    } `
  }

  get isNextDisabled() {
    return (
      (this.step >= 2 && this.individualEmailAddresses.length >= 10) ||
      (this.step >= 1 &&
        (!this.emailInputValid ||
          (this.email.length === 0 &&
            !this.individualEmailAddresses.length))) ||
      this.selectedDocs.length === 0 ||
      this.isLoading
    )
  }

  get toolbarTitle() {
    return ({
      0: 'sharing.selectFilesTitle',
      1: 'sharing.addRecipientsTitle',
      2: 'sharing.confirmTitle',
    } as Record<number, string>)[this.step]
  }

  get emailInputValid() {
    // Referencing this.recompute forces this.$refs.observer to be updated
    // eslint-disable-next-line no-unused-expressions
    this.recompute
    return this.$refs.observer instanceof ValidationObserver
      ? (this.$refs.observer as any).fields.email.valid || this.email === ''
      : false
  }

  get preSelected() {
    if (!this.$route.query.selected) return []
    if (!Array.isArray(this.$route.query.selected))
      return [this.$route.query.selected]
    return this.$route.query.selected
  }

  async addEmail(evt: KeyboardEvent | FocusEvent) {
    await (this.$refs.observer as any).validate()
    if (this.emailInputValid && this.email.length) {
      const email = this.email
      this.email = ''
      this.$nextTick(() => (this.$refs.observer as any).reset())
      if (!this.individualEmailAddresses.includes(email))
        this.individualEmailAddresses.push(email)
    }
  }

  removeEmail(index: number) {
    this.individualEmailAddresses.splice(index, 1)
  }

  async submit() {
    this.isLoading = true
    const collection = await this.$store.dispatch('user/createCollection', {
      name: this.name,
      documentIds: this.selectedDocs.map((d) => d.id),
      individualEmailAddresses: this.individualEmailAddresses,
      agencyOfficersEmailAddresses: [], // TODO: implement
    })

    await snackbarStore.setParams({
      message: `${this.$t('toast.sharingComplete') as string}`,
      actions: [
        {
          name: 'controls.view',
          do: () => {
            this.$router.push(
              this.localeRoute({
                path: `/collections/${collection.id}/documents`,
                query: {
                  owner: userStore.ownerId,
                },
              }) as RawLocation,
            )
          },
        },
      ],
    })

    await snackbarStore.setVisible(true)

    if (window.history.length) {
      this.$router.back()
    } else {
      this.$router.push(
        this.localeRoute({
          path: '/dashboard',
          query: {
            showSnack: 'true',
            tab: 'tab-collections',
          },
        }) as RawLocation,
      )
    }
  }

  cancel() {
    this.$router.back()
  }

  /**
   * Unfortunately we need this little hack to get emailInputValid to
   * recognise when ValidationObserver is added to the DOM
   */
  @Watch('step')
  recomputer() {
    setTimeout(() => {
      this.recompute = !this.recompute
    }, 500)
  }
}
</script>

<style lang="scss">
.v-window {
  height: 100vh;
  .window-container {
    margin: 4rem auto 6rem auto;
  }
}
.v-card.invitee {
  max-width: 40rem;
}
</style>
