var React = require('react');
var MyInputFields = require('./MyInputFields');
import AceEditor from 'react-ace';
var react = require('react-ace');
var Modal = require('react-modal');

// styles for modal
const customStyles = {
  content : {
    top                   : '50%',
    left                  : '50%',
    right                 : 'auto',
    bottom                : 'auto',
    marginRight           : '-50%',
    transform             : 'translate(-50%, -50%)',
    height                : '280px',
    width                 : '700px'
  }
};

var MySidePanel = React.createClass({

  getInitialState: function() {
    // gets trigger options with ajax call when component is first rendered
    return {
      modalIsOpen: false,
      info: this.props.info,
      fields: this.props.info.fields,
      trackingTrigger: null,
      active: this.props.info.active,
      tagId: this.props.info._id,
      errors: {},
      triggerOptions: null,
      changes: '',
      template: '',
      specificTrigger: null,
    };
  },

  // opens modal
  openModal: function() {
    this.setState({modalIsOpen: true});
  },

  // not used?
  afterOpenModal: function() {
    // references are now sync'd and can be accessed.
    this.refs.subtitle.style.color = '#0081BA';
  },

  // closes modal
  closeModal: function() {
    this.setState({modalIsOpen: false});
  },

  componentWillReceiveProps: function(nextProps) {
    // resets information on sidepanel when new row is clicked
    console.log('nextProps____________', nextProps)
    $.ajax({
      url: '/options' + window.location.search,
      type: 'GET',
      success: function(data) {
        console.log('get options successful', data);
        var options = {'inHeader': [], 'onDocumentReady': [], 'onPageLoad': [], 'onEvent': [], 'onTrigger': []};
        for (var i = 0; i < data.length; i ++) {
          var d = data[i].split(',');
          for (var option in options) {
            if (d[0] === option && d[1] !== nextProps.info.name) {
              options[option].push(d[1]);
            }
          }
        }
        console.log('optionssss', options)
        this.setState({triggerOptions: options})
      }.bind(this),
      error: function(err) {
        console.error("Err posting", err.toString());
      }
    });
    if (nextProps.info) {
      this.setState({
        info: nextProps.info,
        fields: nextProps.info.fields,
        changes: nextProps.info.template,
        clickUpdate: false,
        trackingTrigger: nextProps.info.trackingTriggerType,
        specificTrigger: nextProps.info.trackingTrigger
      })
    }
  },

  // sends updated tag info to backend and re-renders row and sidepanel properly
  onUpdate: function() {

    var data = {};
    var errors = {}
    data.fields = [];

    // sets tokens correctly to be handled on backend
    this.state.fields.map(function(field){
      if (! field.value) {
        errors[field.name] = `${field.name} is required`;
      } else {
    	   data[field.name] = field.value;
         data.fields.push({"name": field.name, "value": field.value})
      }
    })
    console.log('here are the new fields', data)

    var trigger;
    if (this.state.trackingTrigger === 'onDocumentReady'||this.state.trackingTrigger === 'inHeader') {
      trigger = this.state.trackingTrigger + ',' + this.state.trackingTrigger;
    } else if (this.state.trackingTrigger === 'onPageLoad' || this.state.trackingTrigger === 'onEvent' || this.state.trackingTrigger === 'onTrigger') {
      trigger = this.state.trackingTrigger + ',' + this.state.specificTrigger;
    }
    data.trackingTrigger = trigger;
    // sets up all other info correctly to be handled on backend
    data.active = this.state.info.active;
    data.template = this.state.template;
    // data.name = this.state.name;

    // ajax call to update tag on backend
    if (Object.keys(errors).length === 0) {
      return $.ajax({
        url: '/tag/' + this.props.info._id + window.location.search,
        type: 'PUT',
        data: data,
        success: function(response) {
          console.log("response", response)
          // updates front end row and sidepanel with newly updated tag
          this.props.onDownload(this.props.splicedArray.slice(0, this.props.index).concat(
              Object.assign({}, this.props.splicedArray[this.props.index], response), this.props.splicedArray.slice(this.props.index + 1)))

          // sets condition to show updated message
          this.setState({
            clickUpdate: true
          })
        }.bind(this),
        error: function(err) {
          console.error("Err posting", err.toString());
        }
      });
    } else {
      this.setState({
        errors: errors
      });
    }
  },

  // sends delete call to backend for a tag and re-renders rows and sidepanel properly
  onDelete: function() {

    return $.ajax({
      url: '/tag/' + this.props.info._id + window.location.search,
      type: 'DELETE',
      success: function(data) {
        //  sets deleted state up to MyTagsPage to re-render sidepanel properly
        this.props.onDelete();
        //  re-renders rows
        this.props.onDownload(this.props.downloaded.slice(0, this.props.index).concat(this.props.downloaded.slice(this.props.index + 1)));
      }.bind(this),

      error: function(err) {
        console.error("Err posting", err.toString());
      }
    });
  },

  onChangeTokens: function(field, e) {
    // error handling and changing state for token input values
    var newState = Object.assign({}, this.state);
    newState.errors[e.target.name] = false;
    newState.fields[field].value = e.target.value;
    this.setState(newState);
  },

  // error handling and changes state for enable/disable and triggers
  onChange: function(e) {
    // prevents enable/disable buttons from screwing shit up
    e.preventDefault();

    const expandTriggers = ['onTrigger', 'onEvent', 'onPageLoad'];
    const notExpandTriggers = ['inHeader', 'onDocumentReady'];

    // changes enabled/disabled state
    if (e.target.name === "active") {
      this.setState({info: Object.assign({}, this.state.info, {active: !this.state.info.active})})
    } else {
      //changes trigger value
      var newState = Object.assign({}, this.state);
      newState[e.target.name] = e.target.value;
      this.setState(newState);
    }

    var changingCalledOn = e.target.name === "trackingTrigger";
    var movingToNotExpand = notExpandTriggers.indexOf(e.target.value) > -1;
    var movingToExpand = expandTriggers.indexOf(e.target.value) > -1;

    if (changingCalledOn) {
      if (movingToNotExpand) {
        this.setState({
          specificTrigger: e.target.value
        })
      }
      else if (movingToExpand) {
        this.setState({
          specificTrigger: "Select a trigger"
        })
      }
    }

    // if (e.target.name === "trackingTrigger" && expandTriggers.indexOf(e.target.value) > -1) {
    //   if (notExpandTriggers.indexOf(this.state.specificTrigger) > -1) {
    //     console.log('gh');
    //     this.setState({
    //       specificTrigger: "Select a trigger"
    //     })
    //   }
    // }
  },

  // changes code editor code 
  onChangeSnippet: function(newVal) {
      this.setState({
        changes: newVal
      });
  },

  // changes code editor code in modal once set
  updateCustom: function() {
    this.setState({
      template: this.state.changes,
      modalIsOpen: false
    })
  },

	render: function() {

    // this function combines the tokens property (from masters with description information
    // with the fields property (which has the value) in order to properly display information
    // in the side panel
    var splicedTokenField = [];
    if (this.props.info.fields && this.props.info.tokens) {

      var newTokenField = [];
      var newObj = {};
      for (var j = 0; j < this.props.info.fields.length; j++) {
        for (var i = 0; i < this.props.info.tokens.length; i++) {
          if (this.props.info.tokens[i].tokenName === this.props.info.fields[j].name) {
            newObj = $.extend({}, this.props.info.fields[j], this.props.info.tokens[i])
            newTokenField.push(newObj);
          }
        }
      };
      splicedTokenField = newTokenField;
    }

    //if the tag gets deleted, renders this notification
    if(this.props.deleted) {
      return (
        <div className="sidepanel background--faint">
          <h2 className="push-double--bottom sp-headbig">TAG DETAILS</h2>
              <div className="redbox">
                <p> This tag has now been deleted. This change may take a couple of minutes before it is updated within your Optimizely tag. </p>
                <p> To Re-Add this tag, go to your "Available Tags" tab. </p>
              </div>
        </div>
        )
    }

    // assuming tag is not deleted, displays regular information
    if(!this.props.deleted) {


      // if a tag has been selected, will display the proper information
  		if (this.props.info && Object.keys(this.props.info).length !== 0 || this.props.deleted) {
  			return (
          <div data-toggle='validator' className="sidepanel background--faint">
            <h2 className="push-double--bottom sp-headbig">TAG DETAILS</h2>
            <div className="flex">
              {/* the below fixes a bug - if you've created a new tag on the my tags tab,
                  and you are currently displaying a custom tag in your side panel,
                  the side panel image would disappear. This if/else statement sets
                  the logo back to the custom tag logo. If we weren't to have this statement,
                  we would have to splice the array again within my sidepanel, because as is, logo data
                  isn't passed back into sidepanel when sidepanel is re-rendered, at least apparently for
                  custom tags. I think. Don't quite remember.
              */}
              {this.state.info.logo ?
                <div> <img className='sidepanel-logo' src={this.state.info.logo}/> </div>
              :
                <div> <img className='sidepanel-logo' src="images/custom.png"/> </div>
              }
              <div className='flex flex-v-center'>
                  <div className = 'sidepanel-displayname'> {this.state.info.displayName} </div>
              </div>
            </div>

            <div className='sd-headsmall deschead'> DESCRIPTION </div>
            <div className='tagdesc'>{this.state.info.tagDescription}</div>
            <label className="label label--rule"></label>

            {/* if the tag is custom, it will show a modal to edit the custom code*/}
            {this.props.info.name === "custom" ?
              <div>
                <button className="btn-uniform-add button button--highlight" onClick={this.openModal}> Edit Custom Code</button>
                <Modal
                  isOpen={this.state.modalIsOpen}
                  onAfterOpen={this.afterOpenModal}
                  onRequestClose={this.closeModal}
                  style={customStyles} >
                  <h2 ref="subtitle">Update Custom Tag</h2>
                  <div className='modaltext'>
                    <div> Please update your Javascript code here. </div>
                    <div className="editor">
                      <AceEditor
                        className="editablecustom"
                        mode="javascript"
                        theme="tomorrow"
                        name="editablecustom"
                        height="120px"
                        width="620px"
                        editorProps={{$blockScrolling: true}}
                        value={this.state.changes}
                        onChange={this.onChangeSnippet}
                      />
                    </div>
                  </div>
                  <div className='flex pushed-right'>
                    <button className="button right-margin" onClick={this.closeModal}> Cancel </button>
                    <button className="button button--highlight" onClick={this.updateCustom}> Update Custom Tag </button>
                  </div>
                </Modal>
              </div>
            :
              <div> </div>
            }

            {/*this renders the tokens/field property information */}
            {splicedTokenField.map(function(field, item) {
              var err = this.state.errors[field.name];
              return <MyInputFields
                      key={item} error={err || false}
                      field={field}
                      value={this.state.fields[item].value}
                      onChange={this.onChangeTokens.bind(this, item)}
                      />
            }.bind(this))}
            <div className="flex">
               <div className="flex--1 sd-headsmall"> Called On: </div>
            </div>

            {/*this renders trigger options, makes selected trigger the initial trigger option rendered*/}
            <select className="form-control" name='trackingTrigger' onChange={this.onChange}>
              {
                ['inHeader', 'onDocumentReady', 'onTrigger', 'onEvent', 'onPageLoad'].map((item) => {
                  var selected = (item === this.state.trackingTrigger);
                  return <option value={item} selected={selected}> {item} </option>
                })
              }
            </select>



            {/* Renders each trigger option */}
            {
              (this.state.trackingTrigger === 'onTrigger' || this.state.trackingTrigger === 'onEvent' || this.state.trackingTrigger === 'onPageLoad') ? (
                <div>
                <div className="flex">
                  <div className="flex--1 sd-headsmall"> Please Select a Specific Trigger: </div>
                </div>

                <select className="form-control" name='specificTrigger' value={this.state.specificTrigger} onChange={this.onChange}>
                  <option selected>Select a trigger</option>
                {this.state.triggerOptions[this.state.trackingTrigger].map((trigger) => {
                  return (trigger === this.state.specificTrigger) ? <option selected value={trigger}>{trigger}</option> : <option value={trigger}>{trigger}</option>
                  })
                }
              </select>
              </div>
              ) : null
            }

            {/* togglels between enabled and disabled buttons */}
            <div className="flex togglebutton">
              {this.state.info.active === true ?
                  <div>
                    <button className="button button--highlight" name='active' onClick={this.onChange}>Enabled</button>
                    <button className="button" name='active' onClick={this.onChange}>Disabled</button>
                  </div>
               :
                  <div>
                    <button className="button" name='active' onClick={this.onChange}>Enabled</button>
                    <button className="button button--highlight" name='active' onClick={this.onChange}>Disabled</button>
                  </div>

                }
            </div>

            <div>
              {this.state.specificTrigger !== "Select a trigger" ?
               <button className="btn-uniform-add button button--highlight" onClick={this.onUpdate}>Update Tag</button> :
               <button className="btn-uniform-add button button--highlight" disabled onClick={this.onUpdate}>Update Tag</button>}
            </div>
            <div>
              <button className="btn-uniform-del button button--highlight" onClick={this.onDelete}>Delete</button>
            </div>
            {this.state.clickUpdate ?
              <div className="yellowbox">
                This tag has now been updated. This change may take a couple of minutes before it is updated within your Optimizely tag.
              </div>
            :
              <div></div>
            }
          </div>
        )

  		} else {
        // if no tag is selected, displays this information
  			return (
          <div className="sidepanel background--faint">
            <h2 className="push-double--bottom sp-headbig">TAG DETAILS</h2>
            <div> Select a Tag to view Details. </div>
          </div>
        )
      // below brace closes else statement
  		}
    // below brace closes else of if not deleted statement
    }
  //below brace closes render function
  }
})


module.exports = MySidePanel;
