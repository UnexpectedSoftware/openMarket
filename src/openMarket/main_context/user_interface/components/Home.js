import React, { Component } from 'react';
import { Link } from 'react-router';


export default class Home extends Component {
    render() {
        return (
            <div>
                <div className="pepe">
                    <h2>Home</h2>
                    <Link to="/counter">to Counter</Link>
                </div>
            </div>
        );
    }
}