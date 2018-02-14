import { Events, Styler, UICorePlugin, template } from 'clappr'

import pluginLevelHtml from './public/level-selector.html'
import pluginBitrateHtml from './public/bitrate-selector.html'
import pluginStyle from './public/style.scss'

const AUTO = -1
const VERSION = '0.0.1'

export default class BitrateSelector extends UICorePlugin {
  static get version () { return VERSION }

  get name () { return 'bitrate_selector' }

  get templateLevel () { return template(pluginLevelHtml) }

  get templateBitrate () { return template(pluginBitrateHtml) }

  get attributes () {
    return {
      'class': this.name,
      'data-bitrate-selector': ''
    }
  }

  get events () {
    return {
      'click [data-level-selector-select]': 'onLevelSelect',
      'click [data-level-selector-button]': 'onShowSelectMenu',
      'click [data-bitrate-selector-select]': 'onBitrateSelect',
      'click [data-bitrate-selector-button]': 'onShowSelectMenu'
    }
  }

  bindEvents () {
    this.listenTo(this.core, Events.CORE_READY, this.bindPlaybackEvents)

    this.listenTo(this.core.mediaControl, Events.MEDIACONTROL_CONTAINERCHANGED, this.reload)
    this.listenTo(this.core.mediaControl, Events.MEDIACONTROL_RENDERED, this.render)
    this.listenTo(this.core.mediaControl, Events.MEDIACONTROL_HIDE, this.hideSelectLevelMenu)
  }

  unBindEvents () {
    this.stopListening(this.core, Events.CORE_READY)
    this.stopListening(this.core.mediaControl, Events.MEDIACONTROL_CONTAINERCHANGED)
    this.stopListening(this.core.mediaControl, Events.MEDIACONTROL_RENDERED)
    this.stopListening(this.core.mediaControl, Events.MEDIACONTROL_HIDE)
    this.stopListening(this.core.getCurrentPlayback(), Events.PLAYBACK_LEVELS_AVAILABLE)
    this.stopListening(this.core.getCurrentPlayback(), Events.PLAYBACK_LEVEL_SWITCH_START)
    this.stopListening(this.core.getCurrentPlayback(), Events.PLAYBACK_LEVEL_SWITCH_END)
    this.stopListening(this.core.getCurrentPlayback(), Events.PLAYBACK_BITRATE)

    this.stopListening(this.core.getCurrentPlayback(), Events.PLAYBACK_PAUSE)
  }

  bindPlaybackEvents () {
    var currentPlayback = this.core.getCurrentPlayback()
    this.listenTo(currentPlayback, Events.PLAYBACK_PAUSE, this.playBackPause)

    this.listenTo(currentPlayback, Events.PLAYBACK_LEVELS_AVAILABLE, this.fillLevels)
    this.listenTo(currentPlayback, Events.PLAYBACK_LEVEL_SWITCH_START, this.startLevelSwitch)
    this.listenTo(currentPlayback, Events.PLAYBACK_LEVEL_SWITCH_END, this.stopLevelSwitch)
    this.listenTo(currentPlayback, Events.PLAYBACK_BITRATE, this.updateCurrentLevel)

    var playbackLevelsAvaialbeWasTriggered = currentPlayback.levels && currentPlayback.levels.length > 0
    playbackLevelsAvaialbeWasTriggered && this.fillLevels(currentPlayback.levels)
  }

  playBackPause () {
    this.core.$('.player-poster, .player-poster svg').show()
  }

  reload () {
    this.unBindEvents()
    this.bindEvents()
    this.bindPlaybackEvents()
  }

  shouldLevelRender () {
    if (!this.core.getCurrentContainer()) return false

    var currentPlayback = this.core.getCurrentPlayback()
    if (!currentPlayback) return false

    var respondsToCurrentLevel = currentPlayback.currentLevel !== undefined
    // Only care if we have at least 2 to choose from
    var hasLevels = !!(this.levels && this.levels.length > 1)

    return respondsToCurrentLevel && hasLevels
  }

  shouldBitrateRender () {
    if (!this.core.getCurrentContainer()) return false
    var currentPlayback = this.core.getCurrentPlayback()
    if (!currentPlayback) return false
    if (this.levels) return false
    if (this.core.options.bitrateSelectorConfig === undefined) return false
    if (!this.core.options.bitrateSelectorConfig.bitrates) return false
    if (this.core.options.bitrateSelectorConfig.bitrates.length < 2) return false
    return true
  }

  render () {
    if (this.shouldLevelRender()) {
      let style = Styler.getStyleFor(pluginStyle, { baseUrl: this.core.options.baseUrl })
      this.$el.html(this.templateLevel({ 'levels': this.levels, 'title': this.getTitle() }))
      this.$el.append(style)
      this.core.mediaControl.$('.media-control-right-panel').append(this.el)
      this.highlightCurrentLevel()
    } else if (this.shouldBitrateRender()) {
      this.bitrates = this.core.options.bitrateSelectorConfig.bitrates
      let style = Styler.getStyleFor(pluginStyle, { baseUrl: this.core.options.baseUrl })
      this.$el.html(this.templateBitrate({ 'bitrates': this.bitrates, 'title': this.getTitle() }))
      this.$el.append(style)
      this.core.mediaControl.$('.media-control-right-panel').append(this.el)
      for (let i = 0; i < this.bitrates.length; i++) {
        if (this.currentBitrate === undefined &&
          this.bitrates[i].default !== undefined &&
          this.bitrates[i].default &&
          this.bitrates[i].src === this.core.options.source) {
          this.currentBitrate = i
        }
      }
      this.highlightCurrentBitrate()
    }
    return this
  }

  fillLevels (levels, initialLevel = AUTO) {
    if (this.selectedLevelId === undefined) this.selectedLevelId = initialLevel
    this.levels = levels
    this.configureLevelsLabels()
    this.render()
  }

  configureLevelsLabels () {
    if (this.core.options.bitrateSelectorConfig === undefined) return

    var labelCallback = this.core.options.bitrateSelectorConfig.labelCallback
    if (labelCallback && typeof labelCallback !== 'function') {
      throw new TypeError('labelCallback must be a function')
    }

    var hasLabels = this.core.options.bitrateSelectorConfig.labels
    var labels = hasLabels ? this.core.options.bitrateSelectorConfig.labels : {}

    if (labelCallback || hasLabels) {
      var level
      var label
      for (var levelId in this.levels) {
        level = this.levels[levelId]
        label = labels[level.id]
        if (labelCallback) {
          level.label = labelCallback(level, label)
        } else if (label) {
          level.label = label
        }
      }
    }
  }

  findLevelBy (id) {
    var foundLevel
    this.levels.forEach((level) => { if (level.id === id) { foundLevel = level } })
    return foundLevel
  }

  onLevelSelect (event) {
    this.selectedLevelId = parseInt(event.target.dataset.levelSelectorSelect, 10)
    if (this.core.getCurrentPlayback().currentLevel === this.selectedLevelId) return false
    this.core.getCurrentPlayback().currentLevel = this.selectedLevelId

    this.toggleContextMenu()
    event.stopPropagation()
    return false
  }

  onBitrateSelect (event) {
    this.selectedBitrateId = parseInt(event.target.dataset.bitrateSelectorSelect, 10)
    let time = this.core.mediaControl.container.getCurrentTime()
    this.isPlay = this.core.getCurrentPlayback().isPlaying()

    this.core.configure({
      source: this.bitrates[this.selectedBitrateId].src,
      autoPlay: this.isPlay
    })

    this.core.mediaControl.container.seek(time)
    this.core.mediaControl.enable()
    this.currentBitrate = this.selectedBitrateId
    this.toggleContextMenu()

    event.stopPropagation()
    return false
  }

  onShowSelectMenu (event) { this.toggleContextMenu() }

  hideSelectLevelMenu () { this.$('.bitrate_selector ul').hide() }

  toggleContextMenu () { this.$('.bitrate_selector ul').toggle() }

  buttonElement () { return this.$('.bitrate_selector button') }

  levelElement (id) {
    return this.$('.bitrate_selector ul a' + (!isNaN(id) ? '[data-level-selector-select="' + id + '"]' : '')).parent()
  }

  bitrateElement (id) {
    return this.$('.bitrate_selector ul a' + (!isNaN(id) ? '[data-bitrate-selector-select="' + id + '"]' : '')).parent()
  }

  getTitle () { return (this.core.options.bitrateSelectorConfig || {}).title }

  startLevelSwitch () { this.buttonElement().addClass('changing') }

  stopLevelSwitch () { this.buttonElement().removeClass('changing') }

  updateText (level) {
    if (level === AUTO) {
      this.buttonElement().text(this.currentLevel ? 'AUTO (' + this.currentLevel.label + ')' : 'AUTO')
    } else {
      this.buttonElement().text(this.findLevelBy(level).label)
    }
  }

  updateCurrentLevel (info) {
    var level = this.findLevelBy(info.level)
    this.currentLevel = level || null
    this.highlightCurrentLevel()
  }

  highlightCurrentLevel () {
    this.levelElement().removeClass('current')
    this.currentLevel && this.levelElement(this.currentLevel.id).addClass('current')
    this.updateText(this.selectedLevelId)
  }

  highlightCurrentBitrate () {
    this.bitrateElement().removeClass('current')
    if (this.bitrates && this.currentBitrate !== undefined && this.bitrates[this.currentBitrate].label) {
      this.bitrateElement(this.currentBitrate).addClass('current')
      this.buttonElement().text(this.bitrates[this.currentBitrate].label) 
    }
  }
}
