Sub Main()
  RunTpp()
End Sub


Sub RunTpp()

  tpp = {}

' content is on sd or usb hard drive - select here
  tpp.baseDir$ = "usb1"
  tpp.baseDir$ = "sd"

  EnableZoneSupport(true)
  
  tpp.msgPort = CreateObject("roMessagePort")

  tpp.ear = newEar(tpp.msgPort)

  r = CreateObject("roRectangle", 0, 0, 1920, 1080)
  tpp.imagePlayer = CreateObject("roImageWidget", r)
  tpp.imagePlayer.SetDefaultMode(1)
	tpp.imagePlayer.Show()

  tpp.timer = CreateObject("roTimer")
  tpp.timer.setPort(tpp.msgPort)
  tpp.timer.SetElapsed(4, 0)

  tpp.processHtmlEvent = processHtmlEvent
  tpp.startPlayback = startPlayback
  tpp.pausePlayback = pausePlayback
  tpp.switchAlbum = switchAlbum
  tpp.nextPhoto = nextPhoto

  tpp.eventLoop = EventLoop

  print "PhotoPlayer start"
  manifest$ = ReadAsciiFile(tpp.baseDir$ + ":/mediaItems/photoCollectionManifest.json")
  tpp.photoManifest = ParseJson(manifest$)

  tpp.eventLoop(tpp.msgPort)

End Sub


Function newEar(msgPort As Object) As Object

  t = {}
  t.msgPort = msgPort

  print "=== Setting up node server..."
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


Sub EventLoop(msgPort As Object)

  while true
    event = wait(0, msgPort)
    print "event: " + type(event)
    if type(event) = "roTimerEvent" then
      m.nextPhoto()
    else if type(event) = "roHtmlWidgetEvent" then
      m.processHtmlEvent(event)
    endif
  end while

End Sub


Sub processHtmlEvent(event As Object)

  eventData = event.GetData()
'      print "reason:"
'      print eventData.reason
  if eventData.reason = "message" then
'        print "message:"
'        print eventData.message
    message = eventData.message
    if type(message.event) = "roString" then
      if message.event = "intentParsed" then
        if type(message.payload) = "roString" then

          payload = ParseJson(message.payload)
          intent = payload.intent
          input = payload.input
          slots = payload.slots
          
          print "intent:"
          print intent.intentName
          
          print "input:"
          print input

          if type(slots) = "roArray" then
            if slots.count() > 0 then
              slot = slots[0]

              print "slotName:"
              print slot.slotName

              print "rawValue:"
              print slot.rawValue

              if type(slot.value) = "roAssociativeArray" then
                print "slotValue:"
                print slot.value
                command = slot.value.value
                if command = "on" then
                  m.startPlayback()
                else if command = "off" then
                  m.pausePlayback()
                else if command = "blue" then
                  m.switchAlbum("New Zealand -Abel Tasman")
                else if command = "red" then
                  m.switchAlbum("Cabo2018")
                endif
              endif
            endif
          endif
        endif
      endif
    endif
  endif
End Sub


Sub startPlayback()
  m.timer.Start()
End Sub


Sub pausePlayback()
  m.timer.Stop()
End Sub


Sub switchAlbum(albumName As String)
  m.photoIndex% = -1
  m.photoIds = m.photoManifest.albums[albumName]
  m.numPhotos% = m.photoIds.count()
End Sub


Sub nextPhoto()

  ' perform initialization (select album) if necessary
  if m.numPhotos% = invalid then
    m.switchAlbum("Cabo2018")
  endif

  m.photoIndex% = m.photoIndex% + 1
  if m.photoIndex% >= m.numPhotos% then
    m.photoIndex% = 0
  endif

  photoId$ = m.photoIds[m.photoIndex%]
  filePath$ = m.baseDir$ + ":/mediaItems/" + photoId$ + ".jpg"

  aa = {}
  aa.filename = filePath$
  ok = m.imagePlayer.DisplayFile(aa)
  print "DisplayFile returned: ";ok
  print filePath$

  m.timer.Start()

End Sub




