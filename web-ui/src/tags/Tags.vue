<!--
  - Copyright (C) 2022 Intel Corporation
  - SPDX-License-Identifier: BSD-3-Clause
  -->

<template>

  <page-header
    :pageErrors="pageErrors"
    @viewed="pageErrors.splice($event, 1)"
  >

    <template v-slot:left-content>
      <button
        class="w3-button w3-margin-left w3-large"
        :class="{ 'w3-border w3-border-green': cfg.isFiltering }"
        @click="onFiltering"
      >
        <i class="fa fa-filter"></i>
      </button>
    </template>

    <template v-slot:center-content>
      <pagination
        :pageProps="cfg.pageProps"
        @query="onPageUpdate"
      />
    </template>

    <template v-slot:right-content>

      <table class="w3-right">
        <tr>
          <td>
            <on-off-switch
              class="w3-cell-middle"
              :state="cfg.isPolling"
              @changed="setPolling"
            />
            Polling
            <select
              class="w3-tiny"
              :value="cfg.pollingInterval"
              @change="onPollingInterval($event.target.value)"
            >
              <option
                v-for="item in pollingOptions"
                :value="item.value"
                :key="item.value"
              >
                {{ item.text }}
              </option>
            </select>
          </td>

          <td>
            <div
              class="w3-button w3-large"
              @click="onRefresh"
              title="Refresh"
            >
              <i
                class="fa fa-refresh"
                :class="{ 'fa-spin': loading }"
              ></i>
            </div>
          </td>
          <td>
            <div class="w3-bar-item w3-dropdown-hover w3-black">
              <button class="w3-button w3-large"><i class="fa fa-download"></i></button>
              <div
                class="w3-dropdown-content w3-bar-block"
                style="right:0"
              >
                <button
                  class="w3-bar-item w3-button w3-large"
                  @click="onDownloadAll"
                >Download All</button>
                <button
                  class="w3-bar-item w3-button w3-large"
                  @click="onDownloadChecked"
                >Download Checked</button>
              </div>
            </div>
          </td>
          <td>
            <div class="w3-bar-item w3-dropdown-hover w3-black">
              <button class="w3-button"><i class="fa fa-trash"></i></button>
              <div
                class="w3-dropdown-content w3-bar-block"
                style="right:0"
              >
                <button
                  class="w3-bar-item w3-button w3-large"
                  @click="onDeleteAll"
                >Delete All</button>
                <button
                  class="w3-bar-item w3-button w3-large"
                  @click="onDeleteChecked"
                >Delete Checked</button>
              </div>
            </div>
          </td>

        </tr>
      </table>

    </template>

  </page-header>

  <div
    v-if="cfg.isFiltering"
    class="w3-row w3-dark-grey w3-small"
  >

    <div class="w3-col l3 w3-center w3-margin-top">
      <tag-filter-input
        :filter="cfg.filter.epc"
        placeholder="EPC Filter"
        @change="updateFilter('epc', $event)"
      />
    </div>

    <div class="w3-col l3 w3-center w3-margin-top">
      <tag-filter-input
        :filter="cfg.filter.tid"
        placeholder="TID Filter"
        @change="updateFilter('tid', $event)"
      />
    </div>

    <div class="w3-col l12">
      &nbsp;
    </div>

  </div>

  <div v-if="tags">

    <div
      id="table_header"
      class="w3-row w3-grey"
    >
      <div
        class="w3-col l3 w3-button"
        @click="doSort('EPC')"
      >EPC
        <sort-indicator
          id='EPC'
          :sort="cfg.sort"
        />
      </div>
      <div
        class="w3-col l3 w3-button"
        @click="doSort('TID')"
      >TID
        <sort-indicator
          id='TID'
          :sort="cfg.sort"
        />
      </div>
      <div
        class="w3-col l1 w3-button"
        @click="doSort('State')"
      >State
        <sort-indicator
          id='State'
          :sort="cfg.sort"
        />
      </div>
      <div
        class="w3-col l2 w3-button"
        @click="doSort('Location')"
      >Location
        <sort-indicator
          id='Location'
          :sort="cfg.sort"
        />
      </div>
      <div
        class="w3-col l1 w3-button"
        @click="doSort('Facility')"
      >Facility
        <sort-indicator
          id='Facility'
          :sort="cfg.sort"
        />
      </div>
      <div
        class="w3-col l2 w3-button"
        @click="doSort('LastRead')"
      >Last Read
        <sort-indicator
          id='LastRead'
          :sort="cfg.sort"
        />
      </div>
    </div>

    <div
      v-for="tag in tags"
      v-bind:key="tag.epc"
      class="w3-row w3-padding w3-border-bottom"
    >
      <div class="w3-col l3 no-text-overflow">{{tag.epc}}</div>
      <div class="w3-col l3 no-text-overflow no-collapse">{{tag.tid}}</div>
      <div class="w3-col l1">{{tag.state}}</div>
      <div class="w3-col l2 no-collapse">
        <div v-if="tag.location">
          {{tag.location.deviceId}}<span>.{{tag.location.antennaPort}}</span>
          <span>&nbsp;{{tag.location.antennaName}}</span>
        </div>
      </div>
      <div class="w3-col l1 no-collapse">{{tag.facilityId}}</div>
      <div class="w3-col l2">
        {{tag.lastRead}}
        <input
          type="checkbox"
          :id="tag.epc"
          :value="tag.epc"
          v-model="checkedTags"
          class="w3-right w3-small w3-button w3-padding-none"
        />
      </div>
    </div>
  </div>

</template>

<script>
import axios from "axios";
import OnOffSwitch from "@/components/OnOffSwitch.vue";
import PageHeader from "@/components/PageHeader.vue";
import Pagination from "@/components/PaginationControl.vue";
import SortIndicator from "@/components/SortIndicator.vue";
import TagFilterInput from "./TagFilterInput.vue";
import Utils from "@/utils.js";

export default {
  name: "TagsCompent",
  components: {
    OnOffSwitch,
    PageHeader,
    Pagination,
    SortIndicator,
    TagFilterInput,
  },
  data() {
    return {
      loading: false,
      pageErrors: [],
      tags: null,
      cfg: {
        isFiltering: false,
        filter: {
          epc: null,
          tid: null,
        },
        isPolling: true,
        pollingInterval: 5000,
        pageProps: {
          offset: 0,
          limit: 20,
          count: 0,
        },
        sort: {
          col: "EPC",
          dir: "ASC",
        },
      },
      pollingHandle: null,
      pollingOptions: [
        { value: 2000, text: "2 sec" },
        { value: 5000, text: "5 sec" },
        { value: 10000, text: "10 sec" },
      ],
      checkedTags: [],
    };
  },
  mounted() {
    const storedCfg = JSON.parse(localStorage.getItem("tagsCfg"));
    if (storedCfg) {
      this.cfg = storedCfg;
    }
    if(this.$store.state.auth.loggedIn) {
      this.onRefresh();
      if (this.cfg.isPolling) {
        this.startPolling();
      }
    }
  },
  beforeUnmount() {
    this.stopPolling();
    localStorage.setItem("tagsCfg", JSON.stringify(this.cfg));
  },
  watch: {
    "$store.state.auth.loggedIn"(val) {
      if (val) {
        this.onRefresh();
        if (this.cfg.isPolling) {
          this.startPolling();
        }
      } else {
        this.stopPolling();
      }
    },
  },
  methods: {
    onRefresh() {
      if (!this.$store.state.auth.loggedIn) {
        return;
      }
      this.loading = true;
      const p = {
        sortCol: this.cfg.sort.col,
        sortDir: this.cfg.sort.dir,
        offset: this.cfg.pageProps.offset,
        limit: this.cfg.pageProps.limit,
      };
      if (this.cfg.isFiltering) {
        p.filterEpc = this.cfg.filter.epc;
        p.filterTid = this.cfg.filter.tid;
      }
      axios
        .get("/tags", { params: p })
        .then((rsp) => {
          if (!rsp || !rsp.data) { throw new Error() }
          this.cfg.pageProps.count = rsp.data.count;
          this.tags = rsp.data.rows;
        })
        .catch((err) => {
          Utils.responseErrorChain(err, this.pageErrors);
        })
        .finally(() => (this.loading = false));
    },
    onFiltering() {
      this.cfg.isFiltering = !this.cfg.isFiltering;
      // if there is any filter criteria being applied
      // offset needs to go back to begining of the record set.
      if (this.cfg.filter.epc || this.cfg.filter.tid) {
        this.cfg.pageProps.offset = 0;
      }
      this.onRefresh();
    },
    updateFilter(type, val) {
      switch (type) {
        case "epc":
          this.cfg.filter.epc = val;
          break;
        case "tid":
          this.cfg.filter.tid = val;
          break;
      }
      // if the filter is different
      // offset needs to go back to beggining of the record set.
      this.cfg.pageProps.offset = 0;
      this.onRefresh();
    },
    startPolling() {
      this.pollingHandle = setInterval(
        this.onRefresh,
        this.cfg.pollingInterval
      );
    },
    stopPolling() {
      clearInterval(this.pollingHandle);
      this.pollingHandle = null;
    },
    setPolling(b) {
      if (b) {
        this.cfg.isPolling = true;
        if(!this.pollingHandle) {
          this.startPolling();
        }
      } else {
        this.cfg.isPolling = false;
        this.stopPolling();
      }
    },
    onPollingInterval(newVal) {
      this.cfg.pollingInterval = newVal;
      if (this.pollingHandle) {
        this.stopPolling();
        this.startPolling();
      }
    },
    onPageUpdate(offset, limit) {
      let i = offset;
      i = i < 0 ? 0 : i;
      i =
        i > this.cfg.pageProps.count
          ? Math.floor(this.cfg.pageProps.count / this.cfg.pageProps.limit) *
            this.cfg.pageProps.limit
          : i;
      this.cfg.pageProps.offset = i;
      this.cfg.pageProps.limit = limit;
      this.onRefresh();
    },
    doSort(col) {
      if (this.cfg.sort.col !== col) {
        this.cfg.sort.col = col;
        this.cfg.sort.dir = "ASC";
      } else {
        if (this.cfg.sort.dir === "ASC") {
          this.cfg.sort.dir = "DESC";
        } else {
          this.cfg.sort.dir = "ASC";
        }
      }
      this.onRefresh();
    },
    onDeleteAll() {
      const answer = window.confirm("This will delete ALL tags! Are you sure?");
      if (!answer) return false;
      this.stopPolling();
      axios
        .delete("/tags")
        .then(() => {
          this.tags = [];
        })
        .catch((err) => {
          Utils.responseErrorChain(err, this.pageErrors);
        })
        .finally(() => {
          if (this.cfg.isPolling) {
            this.startPolling();
          }
        });
    },
    onDeleteChecked() {
      if (this.checkedTags.length === 0) {
        alert("No tags selected");
        return;
      }
      this.stopPolling();
      axios
        .delete("/tags", { data: { tags: this.checkedTags } })
        .then(() => {
          this.tags = this.tags.filter((val) =>
            this.checkedTags.every((ct) => ct !== val.epc)
          );
          this.checkedTags = [];
        })
        .catch((err) => {
          Utils.responseErrorChain(err, this.pageErrors);
        })
        .finally(() => {
          if (this.cfg.isPolling) {
            this.startPolling();
          }
        });
    },
    onDownloadAll() {
      if (this.tags.length === 0) {
        alert("No tags");
        return;
      }
      Utils.download("tags", this.tags);
    },
    onDownloadChecked() {
      const tags = this.tags.filter((val) =>
        this.checkedTags.some((ct) => ct === val.epc)
      );
      if (tags.length === 0) {
        alert("No tags selected");
        return;
      }
      Utils.download("tags", tags);
    },
  },
};
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
.no-collapse {
  min-height: 1px;
}
.no-text-overflow {
  overflow-wrap: break-word;
  word-wrap: break-word;
  -ms-hyphens: auto;
  -moz-hyphens: auto;
  -webkit-hyphens: auto;
  hyphens: auto;
}
</style>
