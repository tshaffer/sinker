Function huectrl_Initialize(msgPort As Object, userVariables As Object, bsp as Object)
'no spaces in names

    print "huectrl_Initialize - entry"

    huectrl = newhuectrl(msgPort, userVariables, bsp)
    return huectrl

End Function


Function newhuectrl(msgPort As Object, userVariables As Object, bsp as Object)

	s = {}
	s.version = 0.1
	s.msgPort = msgPort
	s.userVariables = userVariables
	s.bsp = bsp
	s.ProcessEvent = huectrl_ProcessEvent
	s.objectName = "huectrl_object"
	s.debug  = true
	
		if s.debug then print "Hue Plugin Initializing"
	
	's.udpReceiverPort = 555
	's.udpReceiver = CreateObject("roDatagramReceiver", s.udpReceiverPort)
	's.udpReceiver.SetPort(msgPort)

	s.RequestHueKey = RequestHueKey
	s.HueKeyValid = HueKeyValid
	s.HueControl  = HueControl
	s.HueAllOn    = HueAllOn
	s.HueAllOff   = HueAllOff

	s.SendPluginMessage = SendPluginMessage
	s.SendPluginMessagePlugin = SendPluginMessagePlugin

	s.keyRequest% = 0
	s.HueKey$ = ""
	s.KeyIsValid = false

	s.HueIP$ = "192.168.1.11" ''"192.168.65.122"

	s.url = CreateObject("roUrlTransfer")
	s.url.SetPort(s.msgPort)

	s.RequestHueKey()

	return s
	
End Function

Function huectrl_ProcessEvent(event As Object) as boolean
	'print "huectrl_processevent"
	
	retval = false

	if type(event) = "roAssociativeArray" then
        if type(event["EventType"]) = "roString" then
             if (event["EventType"] = "SEND_PLUGIN_MESSAGE") then
                if event["PluginName"] = "huectrl" then
                    pluginMessage$ = event["PluginMessage"]
					print "SEND_PLUGIN/EVENT_MESSAGE:";pluginMessage$
					messageToParse$ = event["PluginName"]+"!"+pluginMessage$
                    retval = ParsehuectrlPluginMsg(messageToParse$, m)
                endif
            endif
        endif
	else if type(event) = "roDatagramEvent" then
		msg$ = event
		if (left(msg$,6) = "huectrl") then
		    retval = ParsehuectrlPluginMsg(msg$, m)
		end if


	' else if type(event) = "roTimerEvent" 'and event.GetSourceIdentity() = ... then
	' print "Timer event"

	else if type(event) = "roUrlEvent" and event.GetSourceIdentity() = m.keyRequest% then

		if event.GetResponseCode() = 200 then
			print "Url event " + event.GetResponseCode().ToStr() + " " + event.GetString()

			HueResponse = ParseJson(event.GetString())

				if HueResponse[0].DoesExist("success")
				m.HueKey$ = HueResponse[0].Success.username
				print "Found Hue Key: " + m.HueKey$
				
					if writeasciifile("HueKey.txt",m.HueKey$) then
						Message$ = "Key saved to SD"
						m.SendPluginMessage(Message$)
					else
						Message$ = "Error: Could not save key to SD"
						m.SendPluginMessage(Message$)
					end if

				'TODO save to user variable for next time'
				else
					print "TELL USER TO PRESS BUTTON AND TRY AGAIN"
					m.SendPluginMessage("Pair Hue Bridge. Press the button, and then space bar on a USB keyboard, connected to BrightSign") 

				end if

		else
			print "Bad Url Event"
		end if
		'm.HueKey$ = event.GetString()


	' TODO retval=true
	else if type(event) = "roGpioButton" then
	'buttonPressed = event.GetInt()
	'print "Button pressed"+buttonPressed.ToStr()
	'	
	'		'Button 7
	'		if buttonPressed = 7 then
	'		endif 'buttonPressed
	end if

	return retval

End Function


Sub huectrloff()
End Sub

Sub BulbOn()
End Sub

Function ParsehuectrlPluginMsg(origMsg as string, s as object) as boolean
	retval  = false
	command = ""
		
	' convert the message to all lower case for easier string matching later
	msg = lcase(origMsg)
	print "Received Plugin message: "+msg
	r = CreateObject("roRegex", "^huectrl", "i")
	match=r.IsMatch(msg)

	if match then
		retval = true

		' split the string
		r2 = CreateObject("roRegex", "!", "i")
		fields=r2.split(msg)
		numFields = fields.count()
		
		if (numFields < 2) or (numFields > 4) then
			s.bsp.diagnostics.printdebug("Incorrect number of fields for huectrl command:"+msg)
			return retval
		else if (numFields > 1) then
			command=fields[1]
		end if
	end if

	s.bsp.diagnostics.printdebug("command found: " +command)

	if command = "debug" then
		s.bsp.diagnostics.printdebug("Debug Enabled")
	    s.debug=true
	else if command = "reboot" then
		s.bsp.diagnostics.printdebug("Rebooting")
	    rebootsystem()
	else if command ="allon" then 
		print "Hue Truning All On"
		s.HueAllOn()
		
	else if command = "alloff" then
		print "Hue Turning All Off"
		s.HueAllOff()

	else if command = "getkey" then
		s.RequestHueKey()

	else if command = "lightstate" and numFields = 4 then
		print "Controlling Lights..."
		s.HueControl(fields[2].ToInt(), fields[3])

	end if
	
	return retval
end Function

''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''
function HueKeyValid() as boolean

	url = CreateObject("roUrlTransfer")
	url.SetPort(m.msgPort)

	m.HueKey$ = readasciifile("HueKey.txt")

	url$ = "http://" + m.HueIP$ + "/api/" + m.HueKey$ + "/lights"
	print "Url: " + url$
	url.setUrl(url$)
	
	apiResponse$ = url.GetToString()

	apiResponse = ParseJson(apiResponse$)
	
		if type(apiResponse) = "roArray" then
			print "INVALID KEY"
			print apiResponse$
			return false
		
		else
			if type(apiResponse) = "roAssociativeArray" then
				print "Key is valid"

					if apiResponse.IsEmpty() then
						Message$ = "NO Lights Found"
						m.SendPluginMessage(Message$)
					end if

			end if
		end if
	
return true
end function
''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''
function RequestHueKey() as void

	print "Hue Getting API Key"

	print "Checking for existing valid key"
	m.KeyIsValid = m.HueKeyValid()

		if not m.KeyIsValid then

			url$ = "http://" + m.HueIP$ + "/api"
			print "Url: " + url$
			m.url.setUrl(url$)
			m.keyRequest% = m.url.GetIdentity()

			PostJson = {}
			PostJson.AddReplace("devicetype","BlitzDemo")
			PostJson$ = FormatJson(PostJson)
			print "POST for key: " + PostJson$
				if m.url.AsyncPostFromString(PostJson$) then print "PostFromString OK"

		else
			print "Key is valid. OK to proceede"
			
		end if

end function

''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''
function HueControl(bulb as integer, ParamsJson$ as string) as void

m.HueKeyValid()

	if not m.KeyIsValid then 
		Message$ = "Invalid Key"
		print Message$
		m.SendPluginMessage(Message$)
		return
	end if

	url = CreateObject("roUrlTransfer")
	url.SetPort(m.msgPort)

	url$ = "http://" + m.HueIP$ + "/api/" + m.HueKey$ + "/lights/" + bulb.ToStr() + "/state"
	print "Url: " + url$
	url.setUrl(url$)

		if ParseJson(ParamsJson$) = invalid then print "Error: JSON format invalid " + ParamsJson$ : return

	if 200 = url.PutFromString(ParamsJson$) then
		print "Light Control sent " + ParamsJson$
	else
		print "Light Control failed"
	end if	

end function 

''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''
function HueAllOn() As void
	
	for bulb% = 1 to 4
	m.HueControl(bulb%, FormatJson({on: true, transitiontime: 0}))	
	end for
	
end function

''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''
function HueAllOff() As void

	for bulb% = 1 to 4
	m.HueControl(bulb%, FormatJson({on: false, transitiontime: 0}))	
	end for
		
end function

''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''
'function HueSetLightState() As void

'''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''
function SendPluginMessage(Message$ as string) as void

print "Sending Plugin Message " + Message$
pluginMessageCmd = CreateObject("roAssociativeArray")
pluginMessageCmd["EventType"] = "EVENT_PLUGIN_MESSAGE"
pluginMessageCmd["PluginName"] = "huectrl"
pluginMessageCmd["PluginMessage"] = Message$
m.msgPort.PostMessage(pluginMessageCmd)

end function

'''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''
function SendPluginMessagePlugin(Destination$ as string, Message$ as string) as void

print "Sending Plugin Message to a plugin " + Message$
pluginMessageCmd = CreateObject("roAssociativeArray")
pluginMessageCmd["EventType"] = "SEND_PLUGIN_MESSAGE"
pluginMessageCmd["PluginName"] = Destination$
pluginMessageCmd["PluginMessage"] = Message$
m.msgPort.PostMessage(pluginMessageCmd)

end function