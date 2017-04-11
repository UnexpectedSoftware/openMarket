// @flow
import React, { Component } from 'react';
import { Link } from 'react-router';
import ReactTable from 'react-table'
import 'react-table/react-table.css'

const data = [{
  name: 'Tanner Linsley',
  age: 26,
  friend: {
    name: 'Jason Maurer',
    age: 23,
  }
},
  {
    name: 'Tanner Linsley',
    age: 26,
    friend: {
      name: 'Jason Maurer',
      age: 23,
    }
  },
  {
    name: 'Tanner Linsley',
    age: 26,
    friend: {
      name: 'Jason Maurer',
      age: 23,
    }
  },
  {
    name: 'Tanner Linsley',
    age: 26,
    friend: {
      name: 'Jason Maurer',
      age: 23,
    }
  }


];

const columns = [{
  header: 'Name',
  accessor: 'name' // String-based value accessors!
}, {
  header: 'Age',
  accessor: 'age',
  render: props => <span className='number'>{props.value}</span> // Custom cell components!
}, {
  id: 'friendName', // Required because our accessor is not a string
  header: 'Friend Name',
  accessor: d => d.friend.name // Custom value accessors!
}, {
  header: props => <span>Friend Age</span>, // Custom header components!
  accessor: 'friend.age'
}];

class Container extends Component {

  componentWillMount() {
    const { listProductFetch } = this.props;
    listProductFetch();
  }

  render() {
    const { products } = this.props;
    return (
      <div>

        <p>
          <Link to="/">
            <i className="fa fa-arrow-left fa-3x" />
          </Link>
        </p>

        <ReactTable
          data={data}
          columns={columns}
        />



      </div>
    );
  }
}

export default Container;
