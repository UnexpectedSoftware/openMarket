import React, {Component} from 'react';

/**
 * @param {Date} [date]
 * @returns {string}
 */
export function clockText(date) {
  const value = date || new Date();
  const hours = String(value.getHours()).padStart(2, '0');
  const minutes = String(value.getMinutes()).padStart(2, '0');
  return hours + ':' + minutes;
}

/**
 * Local time on the sell bar. The minute is visual and is not stored.
 */
export default class SellClock extends Component {

  constructor(props) {
    super(props);
    this.state = {text: clockText()};
  }

  componentDidMount() {
    this.timer = setInterval(() => {
      this.setState({text: clockText()});
    }, 60000);
  }

  componentWillUnmount() {
    clearInterval(this.timer);
  }

  render() {
    return <time className="sell-clock">{this.state.text}</time>;
  }

}
