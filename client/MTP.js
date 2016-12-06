var React = require('react');
var MTR = require('./MTR');

var MTP = React.createClass({
	getInitialState: function () {
		return {
			projectDoneLoading: false,
			projectHasTags: null
		}
	},

	// if the props had already been received by the component,
	// WillReceiveProps will not be called when tab is switched back to My Tags.
	// This sets the appropriate state under such a scenario.
	componentWillMount: function () {
	   	if (this.props.projectTags.length !== 0) {
			this.setState({
				projectDoneLoading: true,
				projectHasTags: true
			})
		} else {
			this.setState({
				projectDoneLoadng: true, 
				projectHasTags: false
			})
		}
	},

	componentWillReceiveProps: function(nextProps) {
	    if (nextProps.projectTags.length !== 0) {
			this.setState({
				projectDoneLoading: true,
				projectHasTags: true
			})
		} else {
			this.setState({
				projectDoneLoadng: true, 
				projectHasTags: false
			})
		}
	},

	_filterForAddedTags: function(completeTags) {
		var addedTags = [];

		for (var i = 0; i < completeTags.length; i++) {
			if (completeTags[i].added) {
				addedTags.push(completeTags[i])
			}
		}

		return addedTags;
	},

	render: function() {

		var tableHeaders = (
				<div> 
					<h1 className='header1'> My Tags </h1>
		    		<table className="table table--rule table--hover myTable" ref='myTable'>
			          <thead>
			            <tr>
			              <th className = "cell-collapse">Logo</th>
			              <th id ="mytablerow-dn-width" >Name</th>
			              <th id="mytablerow-cat-width">Category</th>
			              <th id="mytablerow-tt-width">Called On</th>
			              <th className="cell-collapse">Status</th>
			            </tr>
			          </thead>
			        </table>
		        </div>
			)

		if (!this.state.projectDoneLoading) {
			return (
				<div>
					{tableHeaders}
					<div className='welcome'> Loading... </div>
					
				</div> 
			)
		} else if (this.state.projectDoneLoading && !this.state.projectHasTags) {
			return (
				<div>
					{tableHeaders}
					<div className='welcome'> Welcome! Go to Available Tags to add your first tag.</div> 
				</div>
				)
		} else {

			var completeTags = this.props.completeTags;
			var addedTags = this._filterForAddedTags(completeTags);
			if (this.props.searchInput.length !== 0) {
				addedTags = this.props._filterForSearchInput(this.props.searchInput, addedTags)
			}


			if (this.props.searchInput.length!==0 && addedTags.length === 0) {
				return (
					<div>
						{tableHeaders}
						<div className='welcome'> No tags match your search. </div> 
					</div>
				)
			}

			return (
				<div> 
					<h1 className='header1'> My Tags </h1>
		    		<table className="table table--rule table--hover myTable" ref='myTable'>
			          <thead>
			            <tr>
			              <th className = "cell-collapse">Logo</th>
			              <th id ="mytablerow-dn-width" >Name</th>
			              <th id="mytablerow-cat-width">Category</th>
			              <th id="mytablerow-tt-width">Called On</th>
			              <th className="cell-collapse">Status</th>
			            </tr>
			          </thead>
			          <tbody>
			          {addedTags.map((tag, i) => {
			          	return <MTR addedTag={tag} key={i} handleRowClick={() => this.props.handleRowClick(tag, i)}/> 
			          	})
			      	  }
			          </tbody>
			        </table>
		        </div>
				)
		}
	}

})

module.exports = MTP;

