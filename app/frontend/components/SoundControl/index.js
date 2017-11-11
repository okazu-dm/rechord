import React, { Component } from "react"
import { Transport, Master, Sampler, MonoSynth, Part } from "tone"

import Button               from "../shared/Button"
import { times }            from "../../constants/times"
import * as instruments     from "../../constants/instruments"
import * as utils           from "../../utils"
import { MAX_VOLUME, STREAK_NOTE, RESUME_NOTE } from "../../constants"

// const chorus = new Tone.Chorus(4, 2.5, 0.5).toMaster()
// const reverb = new Tone.Freeverb(0.5).toMaster()

export default class SoundControl extends Component {
  constructor(props) {
    super(props)
    this.setVolume(props.volume)
    this.state = {
      curretNotes: [],
      instrument:  this.setInstrument("Piano"),
      loading:     true,
      hasLoaded:   false
    }
  }
  componentWillReceiveProps({ bpm, volume, instrument, beatClick }) {
    if (bpm !== this.props.bpm) this.setBpm(bpm)
    if (volume !== this.props.volume) this.setVolume(volume)
    if (!this.state.hasLoaded || instrument !== this.props.instrument) {
      this.setState({
        instrument: this.setInstrument(instrument),
        hasLoaded:  true
      })
    }
    if (this.state.click && (beatClick !== this.props.beatClick)) {
      this.state.click.volume.value = beatClick ? 0 : -100
    }
  }

  setInstrument = (type, cutomOnLoad) => {
    if (this.state && this.state.loading === false) this.setState({ loading: true })
    const onLoad = () => this.setState({ loading: false })
    return new Sampler(...instruments.types(cutomOnLoad || onLoad)[type]).toMaster()
  }
  setClick = () => new MonoSynth(instruments.click).toMaster()

  setInstrumentSchedule = (score) => {
    if (!this.state.hasLoaded) {
      this.setState({
        instrument: this.setInstrument(this.props.instrument),
        hasLoaded: true
      })
    }

    const triggerInstrument = (time, value) => {
      const { notes } = value
      const { instrument, curretNotes } = this.state

      if (notes[0] !== RESUME_NOTE) {
        curretNotes.forEach(note => instrument.triggerRelease(note))
        if (notes === "fin") {
          this.handleStop()
        } else if (notes[0] === STREAK_NOTE) {
          curretNotes.forEach(note => instrument.triggerAttack(note))
        } else {
          notes.forEach(note => instrument.triggerAttack(note))
          this.setState({ curretNotes: notes })
        }
      }
    }
    new Part(triggerInstrument, score).start()
  }
  setClickSchedule = (score) => {
    const { time: selectedTime, beatClick } = this.props
    const click = this.setClick()
    this.setState({ click })
    click.volume.value = beatClick ? 0 : -100

    const triggerClick = (time) => {
      click.triggerAttackRelease("A6", "32n", time, 0.1)
    }
    const setSchedule = () => {
      const barLength = parseInt(score[score.length - 2].time.split(":")[0], 10)
      for (let bar = 0; bar <= barLength; bar += 1) {
        for (let beat = 0; beat < times[selectedTime][0]; beat += 1) {
          Transport.schedule(triggerClick, `${bar}:${beat}:0`)
        }
      }
    }
    setSchedule(score)
  }

  setBpm = (bpm) => {
    Transport.bpm.value = bpm
  }
  setVolume = (volume) => {
    const newVolume = volume - MAX_VOLUME
    Master.volume.value = newVolume
  }

  handleStop = () => {
    const { curretNotes, instrument } = this.state
    curretNotes.forEach(note => instrument.triggerRelease(note))
    Transport.stop()
    Transport.cancel()
    this.props.onChangePlaying(false)
  }
  handleStart = () => {
    const { time, parsedText } = this.props
    const score = utils.makeScore(parsedText, time)
    Transport.timeSignature = times[time]
    this.handleStop()
    this.setInstrumentSchedule(score)
    this.setClickSchedule(score)
    Transport.start("+0.5")
    this.props.onChangePlaying(true)
  }

  render() {
    const { isPlaying, parsedText } = this.props
    const { loading } = this.state
    const cannotPlay = loading || isPlaying || (parsedText.length === 1 && !parsedText[0][0])
    return (
      <div className="field sound-control">
        {isPlaying ? (
          <div className="control">
            <Button
              onClick={this.handleStop}
              color="danger"
              size="medium"
              icon="stop"
              text="stop"
              disabled={!isPlaying}
            />
          </div>
        ) : (
          <div className="control">
            <Button
              onClick={this.handleStart}
              color="info"
              size="medium"
              icon={loading ? "circle-o-notch fa-spin" : "play"}
              text={loading ? "loading..." : "play"}
              disabled={cannotPlay}
            />
          </div>
        )}
      </div>
    )
  }
}
