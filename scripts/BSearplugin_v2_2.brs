'   Project: BrightSign_ear
'   Author: Benjamin Hastings (BrightSign)
'   Brightsign Version: v0.2.1
Function ear_Initialize(msgPort As Object, userVariables As Object, bsp as Object)
  print "=== ear_Initialize"

  ' Build a terminal object
  plugin = ear(msgPort,userVariables, bsp)

  return plugin
End Function

Function ear(msgPort As Object, userVariables As Object, bsp as Object) 
  print "=== ear - Entry"

    ' Create the object to return and set it up
  t = {}

  t.msgPort = msgPort
  t.bsp = bsp
  t.ProcessEvent = ear_ProcessEvent
  t.userVariables = userVariables

  print "=== Setting up node server..."
  'sleep(8000)

  t.htmlRect = CreateObject("roRectangle", 0, 0, 1000, 1080)
  is = {
      port: 2999
  }
  config = {
      nodejs_enabled: true,
      inspector_server: is,
      brightsign_js_objects_enabled: true,
      javascript_enabled: true,
      url:  "file:///sd:/server.html",
      security_params: {websecurity: false}
  }
  t.htmlNet = CreateObject("roHtmlWidget", t.htmlRect, config)
  t.htmlNet.setPort(t.msgPort)
  t.htmlNet.AllowJavaScriptUrls({ all: "*" })
  t.htmlNet.SetUserData("server")
  t.htmlNet.Show()

  return t
End Function


Function ear_ProcessEvent(event As Object) as boolean
  print "=== ear_ProcessEvent"
  
  retval = false

  if type(event) = "roHtmlWidgetEvent" then
   payload = event.GetData()
    if payload.reason = "message" then
      result = payload.message
      print "=== result"
      print result
      if (result.event = "textCaptured") then
        json = ParseJson(result.payload)
        text = json.text
        likelihood = json.likelihood
        print "=== textCaptured:";text
        print "likelihood: ";likelihood

      else if (result.event = "intentParsed") then
        json = ParseJson(result.payload)
        intentName = json.intent.intentName
        probability = json.intent.probability
        print "=== intentParsed:";intentName
        print "probability: ";probability
        retval = parseearPhrase(m, intentName, probability, json)

      else if (result.event = "startListening") then'
        v = "1"
        print "=== startListening: value sent to BA: ";v
        SS_sendPluginEvent(m, v)
        retval = true

      else if (result.event = "stopListening") then'
        v = "0"
        print "=== stopListening: value sent to BA: ";v
        SS_sendPluginEvent(m, v)
        retval = true
      end if
    end if
	else if type(event) = "roAssociativeArray" then
    if type(event["EventType"]) = "roString"
      if (event["EventType"] = "SEND_PLUGIN_MESSAGE") then
        if (event["PluginName"] = "ear") then
          pluginMessage = event["PluginMessage"]
          print "Received a Plugin Message: "; pluginMessage

          if pluginMessage = "showInfo" then
              m.htmlNet.Show()
          else if pluginMessage = "hideInfo" then
              m.htmlNet.Hide()
          end if
        end if
      end if
    end if
  end if

  return retval
End Function


Function parseearPhrase(h as object, intent as string, likelihood as float, json as object) as boolean
  id = "-1"

  if likelihood > .79 then
    if intent = "Aaron:amazon_demo_get_time" then
      id = "2"
    else if intent = "Aaron:amazon_demo_show_my_video" then
      id = "3"
    else if intent = "Aaron:amazon_demo_joke" then
      id = "4"
    else if intent = "Aaron:amazon_demo_weather" then
      id = "5"
    else if intent = "Aaron:amazon_demo_start_timer" then
      'm.userVariables["years"].currentValue$
      'm.userVariables["quarters"].currentValue$
      'm.userVariables["months"].currentValue$
      'm.userVariables["weeks"].currentValue$
      'm.userVariables["days"].currentValue$
      'm.userVariables["hours"].currentValue$
      'm.userVariables["minutes"].currentValue$
      'm.userVariables["seconds"].currentValue$
      id = "6"
    else if intent = "Aaron:amazon_demo_show_camera" then
      id = "7"
    else if intent = "Aaron:amazon_demo_change_light_color" then
      print type(json.slots)
      if json.slots.count() = 0 then
        value = ""
        id = "-1"
        print "No slot value defined: ";id
      else if json.slots.count() > 0 then
        value = json.slots[0].value.value
      end if
      if value = "bright" then
        id = "8a"
      else if value = "dim" then
        id = "8b"
      else if value = "pink" then
        id = "8c"
      else if value = "white" then
        id = "8d"
      else if value = "purple" then
        id = "8e"
      else if value = "red" then
        id = "8f"
      else if value = "yellow" then
        id = "8g"
      else if value = "green" then
        id = "8h"
      else if value = "blue" then
        id = "8i"
      else if value = "off" then
        id = "8j"
      else if value = "on" then
        id = "8k"
      end if
    else if intent = "Aaron:amazon_demo_start_recipe" then
      id = "9"
    else if intent = "Aaron:amazon_demo_play_music" then
      id = "10"
    else if intent = "Aaron:amazon_demo_whats_echo" then
      print type(json.slots)
      if json.slots.count() = 0 then
        value = ""
        id = "-1"
        print "No slot value defined: ";id
      else if json.slots.count() > 0 then
        value = json.slots[0].value.value
      end if
      if value = "Amazon Echo" then
        id = "11a"
      else if value = "Echo Show" then
        id = "11b"
      else if value = "Echo Spot" then
        id = "11c"
      else if value = "Echo Plus" then
        id = "11d"
      else if value = "Echo Dot" then
        id = "11e"
      end if
    else if intent = "Aaron:amazon_demo_turn_on" then
      id = "12"
    else if intent = "Aaron:amazon_demo_show_movie" then
      id = "13"
    else
      print "=== Could not understand phrase!"
    end if
  else
    print "=== likelihood is not > .9, unable to accept!"
  end if
  id = id.trim()
  print "=== likelihood; ";likelihood
  print "=== id: ";id
  print "=== Successfully sent to BrightAuthor"
  SS_sendPluginEvent(h, id)
  return true
End Function

' Send plugin to BrightAuthor
Function SS_sendPluginEvent(h as object, message as string)
    pluginMessageCmd = CreateObject("roAssociativeArray")
    pluginMessageCmd["EventType"] = "EVENT_PLUGIN_MESSAGE"
    pluginMessageCmd["PluginName"] = "ear"
    pluginMessageCmd["PluginMessage"] = message
    h.msgPort.PostMessage(pluginMessageCmd)
End Function