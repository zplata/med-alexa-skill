/* eslint-disable  func-names */
/* eslint quote-props: ["error", "consistent"]*/
/**
 * This sample demonstrates a simple skill built with the Amazon Alexa Skills
 * nodejs skill development kit.
 * This sample supports multiple lauguages. (en-US, en-GB, de-DE).
 * The Intent Schema, Custom Slots and Sample Utterances for this skill, as well
 * as testing instructions are located at https://github.com/alexa/skill-sample-nodejs-fact
 **/

'use strict';

const Alexa = require('alexa-sdk');
const axios = require('axios');
const appId = require('./alexa-stuff');

const handlers = {
  'LaunchRequest': function () {
    console.log("in Launch Request");
    this.response.speak('Welcome to Patient Conditions. I can give you a list of conditions for a patient from the ' +
      'Cerner sandbox. Who do you want conditions for?');
    this.response.listen('Say a patient, like Timmy or Nancy.');
    this.emit(':responseReady');
  },
  'ConditionsIntent': function () {
    // delegate to Alexa to collect all the required slots
    let isTestingWithSimulator = true; //autofill slots when using simulator, dialog management is only supported with a device
    let filledSlots = delegateSlotCollection.call(this, isTestingWithSimulator);

    // console.log("filled slots: " + JSON.stringify(filledSlots));
    // at this point, we know that all required slots are filled.
    let slotValues = getSlotValues(filledSlots);

    // console.log("slotValues: ", slotValues);
    // synonym the person said - slotValues.synonym
    // what that resolved to - slotValues.resolved
    // and if it's a word that is in your slot values - slotValues.isValidated

    // If the user asks for a pet that doesn't exist, we can use entity
    // resolution to make them all map to mythical_creatures.
    // if the user gave us a synonym of mythical_creature then we respond
    // with a randomized funny response and then exit the skill.
    let patientId;
    let patientName;
    switch (slotValues.person.resolved) {
      case 'Connie':
        patientId = '4342012';
        patientName = 'Connie';
        break;
      case 'Hailey':
        patientId = '4342011';
        patientName = 'Hailey';
        break;
      case 'Joe':
        patientId = '4342010';
        patientName = 'Joe';
        break;
      case 'Nancy':
        patientId = '4342009';
        patientName = 'Nancy';
        break;
      case 'Wilma':
        patientId = '4342008';
        patientName = 'Wilma';
        break;
      case 'Timmy':
        patientId = '4342012';
        patientName = 'Timmy';
        break;
      default:
        patientId = '4342012';
        patientName = 'Timmy';
        break;
    }

    //Call the Cerner Ignite API
    axios({
      method: 'get',
      url: `https://fhir-open.sandboxcerner.com/dstu2/0b8a0111-e8e6-4c26-a91c-5069cbc6b1ca/Condition?patient=${patientId}`,
      headers: {
        'Accept': 'application/json+fhir'
      }
    }).then((result) => {
      console.log(`FHIR Results for ${patientId}`, result);
      if (result.data && result.data.entry && result.data.entry.length) {
        const data = c.data.entry;
        const codeObjArray = [];
        const conditionTextArray = [];
        data.filter((item) => {
          const resource = item.resource;
          const hasAppropriateCode = resource && resource.code && resource.code.coding &&
            resource.code.coding[0] && resource.code.coding[0].code;
          const isVerified = resource && resource.verificationStatus === 'confirmed';
          if (hasAppropriateCode && isVerified) {
            const isDuplicate =  codeObjArray.indexOf(resource.code.coding[0].code);
            if (isDuplicate < 0) {
              codeObjArray.push(resource.code.coding[0].code);
              if (!(conditionTextArray.length > 5)) {
                conditionTextArray.push(resource.code.coding[0].display);
              }
              return true;
            }
            return false;
          }
          return false;
        });

        let message = '';
        if (conditionTextArray.length > 0) {
          if (conditionTextArray.length === 1) {
            message = `For ${patientName}, the only condition I found was `;
          } else {
            message = `I found the following conditions for ${patientName}: `;
          }
          for (let i = 0; i < conditionTextArray.length; i+=1) {
            if (i === conditionTextArray - 1 && conditionTextArray.length > 1) {
              message += `and ${conditionTextArray[i]}`;
            } else if (i === conditionTextArray - 1 && conditionTextArray.length === 1) {
              message += conditionTextArray[i];
            } else {
              message += `${conditionTextArray[i]}, `;
            }
          }
        } else {
          message = `Good news! ${patientName} doesn't have any known conditions.`;
        }
        console.log("response, ", message);
        this.response.speak(message);
        this.emit(':responseReady');
      } else {
        this.response.speak(`Good news! ${patientName} doesn't have any known conditions.`);
        this.emit(':responseReady');
      }
    });
  },
  'AMAZON.HelpIntent': function () {
    const speechOutput = this.t('HELP_MESSAGE');
    const reprompt = this.t('HELP_MESSAGE');
    this.emit(':ask', speechOutput, reprompt);
  },
  'AMAZON.CancelIntent': function () {
    this.emit(':tell', this.t('STOP_MESSAGE'));
  },
  'AMAZON.StopIntent': function () {
    this.emit(':tell', this.t('STOP_MESSAGE'));
  },
};

// This data is for testing purposes.
// When isTestingWithSimulator is set to true
// The slots will be auto loaded with this default data.
// Set isTestingWithSimulator to false to disable to default data
const defaultData = [
  {
    "name": "person",
    "value": "timster",
    "ERCode": "ER_SUCCESS_MATCH",
    "ERValues": [
      { "value": "Timmy" }
    ]
  }
];

// ***********************************
// ** Dialog Management
// ***********************************

function getSlotValues (filledSlots) {
  //given event.request.intent.slots, a slots values object so you have
  //what synonym the person said - .synonym
  //what that resolved to - .resolved
  //and if it's a word that is in your slot values - .isValidated
  let slotValues = {};

  console.log('The filled slots: ' + JSON.stringify(filledSlots));
  Object.keys(filledSlots).forEach(function(item) {
    //console.log("item in filledSlots: "+JSON.stringify(filledSlots[item]));
    var name = filledSlots[item].name;
    //console.log("name: "+name);
    if(filledSlots[item]&&
      filledSlots[item].resolutions &&
      filledSlots[item].resolutions.resolutionsPerAuthority[0] &&
      filledSlots[item].resolutions.resolutionsPerAuthority[0].status &&
      filledSlots[item].resolutions.resolutionsPerAuthority[0].status.code ) {

      switch (filledSlots[item].resolutions.resolutionsPerAuthority[0].status.code) {
        case "ER_SUCCESS_MATCH":
          slotValues[name] = {
            "synonym": filledSlots[item].value,
            "resolved": filledSlots[item].resolutions.resolutionsPerAuthority[0].values[0].value.name,
            "isValidated": true
          };
          break;
        case "ER_SUCCESS_NO_MATCH":
          slotValues[name] = {
            "synonym": filledSlots[item].value,
            "resolved": filledSlots[item].value,
            "isValidated":false
          };
          break;
      }
    } else {
      slotValues[name] = {
        "synonym": filledSlots[item].value,
        "resolved": filledSlots[item].value,
        "isValidated": false
      };
    }
  },this);
  //console.log("slot values: "+JSON.stringify(slotValues));
  return slotValues;
}

// this function will keep any slot values currently in the request
// and will fill other slots with data from testData
function fillSlotsWithTestData(testData) {
  console.log("in fillSlotsWithTestData");

  //console.log("testData: "+JSON.stringify(testData));
  //loop through each item in testData
  testData.forEach(function(item, index, arr) {
    //check to see if the slot exists
    //console.log("item: "+JSON.stringify(item));
    if (!this.event.request.intent.slots[item.name].value) {
      //fill with test data
      //construct the element
      let newSlot = {
        "name": item.name,
        "value": item.value,
        "resolutions": {
          "resolutionsPerAuthority": [
            {
              "authority": "",
              "status": {
                "code": item.ERCode,
              },
            }
          ]
        },
        "confirmationStatus": "CONFIRMED"
      };

      //add Entity resolution values
      if (item.ERCode == "ER_SUCCESS_MATCH") {
        let ERValuesArr = [];
        item.ERValues.forEach(function(ERItem){
          let value = {
            "value": {
              "name": ERItem.value,
              "id": ""
            }
          };
          ERValuesArr.push(value);
        })
        newSlot.resolutions.resolutionsPerAuthority[0].values=ERValuesArr;
      }

      //add the new element to the response
      this.event.request.intent.slots[item.name]=newSlot;
    }
  },this);

  //console.log("leaving fillSlotsWithTestData");
  return this.event.request.intent.slots;
}

// Given the request an slot name, slotHasValue returns the slot value if one
// was given for `slotName`. Otherwise returns false.
function slotHasValue(request, slotName) {

  let slot = request.intent.slots[slotName];

  //uncomment if you want to see the request
  //console.log("request = "+JSON.stringify(request));
  let slotValue;

  //if we have a slot, get the text and store it into speechOutput
  if (slot && slot.value) {
    //we have a value in the slot
    slotValue = slot.value.toLowerCase();
    return slotValue;
  } else {
    //we didn't get a value in the slot.
    return false;
  }
}

// If the user said a synonym that maps to more than one value, we need to ask
// the user for clarification. Disambiguate slot will loop through all slots and
// elicit confirmation for the first slot it sees that resolves to more than
// one value.
function disambiguateSlot() {
  let currentIntent = this.event.request.intent;

  Object.keys(this.event.request.intent.slots).forEach(function(slotName) {
    let currentSlot = this.event.request.intent.slots[slotName];
    let slotValue = slotHasValue(this.event.request, currentSlot.name);
    if (currentSlot.confirmationStatus !== 'CONFIRMED' &&
      currentSlot.resolutions &&
      currentSlot.resolutions.resolutionsPerAuthority[0]) {

      if (currentSlot.resolutions.resolutionsPerAuthority[0].status.code == 'ER_SUCCESS_MATCH') {
        // if there's more than one value that means we have a synonym that
        // mapped to more than one value. So we need to ask the user for
        // clarification. For example if the user said "mini dog", and
        // "mini" is a synonym for both "small" and "tiny" then ask "Did you
        // want a small or tiny dog?" to get the user to tell you
        // specifically what type mini dog (small mini or tiny mini).
        if ( currentSlot.resolutions.resolutionsPerAuthority[0].values.length > 1 ) {
          let prompt = 'Which patient do you want to want to see? ';
          let size = currentSlot.resolutions.resolutionsPerAuthority[0].values.length;
          currentSlot.resolutions.resolutionsPerAuthority[0].values.forEach(function(element, index, arr) {
            prompt += ` ${(index == size -1) ? ' or' : ' '} ${element.value.name}`;
          });

          prompt += '?';
          let reprompt = prompt;
          // In this case we need to disambiguate the value that they
          // provided to us because it resolved to more than one thing so
          // we build up our prompts and then emit elicitSlot.
          this.emit(':elicitSlot', currentSlot.name, prompt, reprompt);
        }
      } else if (currentSlot.resolutions.resolutionsPerAuthority[0].status.code == 'ER_SUCCESS_NO_MATCH') {
        // Here is where you'll want to add instrumentation to your code
        // so you can capture synonyms that you haven't defined.
        console.log("NO MATCH FOR: ", currentSlot.name, " value: ", currentSlot.value);

        if (REQUIRED_SLOTS.indexOf(currentSlot.name) > -1) {
          let prompt = "What " + currentSlot.name + " are you looking for";
          this.emit(':elicitSlot', currentSlot.name, prompt, prompt);
        }
      }
    }
  }, this);
}

// This function delegates multi-turn dialogs to Alexa.
// For more information about dialog directives see the link below.
// https://developer.amazon.com/docs/custom-skills/dialog-interface-reference.html
function delegateSlotCollection(shouldFillSlotsWithTestData) {
  console.log("in delegateSlotCollection");
  console.log("current dialogState: " + this.event.request.dialogState);

  // This will fill any empty slots with canned data provided in defaultData
  // and mark dialogState COMPLETED.
  // USE ONLY FOR TESTING IN THE SIMULATOR.
  if (shouldFillSlotsWithTestData) {
    fillSlotsWithTestData.call(this, defaultData);
    this.event.request.dialogState = "COMPLETED";
  }

  var updatedIntent = this.event.request.intent;
  if (this.event.request.dialogState === "STARTED") {
    console.log("in STARTED");
    console.log(JSON.stringify(this.event));
    // optionally pre-fill slots: update the intent object with slot values
    // for which you have defaults, then return Dialog.Delegate with this
    // updated intent in the updatedIntent property

    disambiguateSlot.call(this);
    console.log("disambiguated: " + JSON.stringify(this.event));
    return this.emit(":delegate", updatedIntent);
  } else if (this.event.request.dialogState !== "COMPLETED") {
    console.log("in not completed");
    //console.log(JSON.stringify(this.event));

    disambiguateSlot.call(this);
    return this.emit(":delegate", updatedIntent);
  } else {
    console.log("in completed");
    //console.log("returning: "+ JSON.stringify(this.event.request.intent));
    // Dialog is now complete and all required slots should be filled,
    // so call your normal intent handler.
    return this.event.request.intent.slots;
  }
}

exports.handler = function (event, context) {
  const alexa = Alexa.handler(event, context);
  alexa.APP_ID = appId;
  alexa.registerHandlers(handlers);
  alexa.execute();
};

