Sub Main()


  msgPort = CreateObject("roMessagePort")

  ear = newEar(msgPort)
  eventLoop(msgPort)

End Sub


Sub EventLoop(msgPort As Object)

  baseDir$ = "usb1"
  baseDir$ = "sd"

  print "PhotoPlayer start"
  manifest$ = ReadAsciiFile(baseDir$ + ":/mediaItems/photoCollectionManifest.json")
  photoManifest = ParseJson(manifest$)

  photoIds = photoManifest.albums.Cabo2018
  photoIds = photoManifest.albums["New Zealand -Abel Tasman"]

  numPhotos% = photoIds.count()
  photoIndex% = 0

  EnableZoneSupport(true)

  r = CreateObject("roRectangle", 0, 0, 1920, 1080)
  imagePlayer = CreateObject("roImageWidget", r)
  imagePlayer.SetDefaultMode(1)
	imagePlayer.Show()

  timer = CreateObject("roTimer")
  timer.setPort(msgPort)
  timer.SetElapsed(4, 0)
  ' timer.Start()

  aa = {}
  'photoId$ = photoIds[photoIndex%]
  'filePath$ = baseDir$ +":/mediaItems/" + photoId$ + ".jpg"
  'aa.filename = filePath$
  'ok = imagePlayer.DisplayFile(aa)
  'print "DisplayFile returned: ";ok
  'print filePath$

  'playbackActive = false
  photoIds = photoManifest.albums.Cabo2018

  while true

    event = wait(0, msgPort)

    print "event: " + type(event)

    if type(event) = "roTimerEvent" then

      photoIndex% = photoIndex% + 1
      if photoIndex% >= numPhotos% then
        photoIndex% = 0
      endif

      photoId$ = photoIds[photoIndex%]
      filePath$ = baseDir$ + ":/mediaItems/" + photoId$ + ".jpg"
      aa.filename = filePath$
      ok = imagePlayer.DisplayFile(aa)
      print "DisplayFile returned: ";ok
      print filePath$

      timer.Start()

    else if type(event) = "roHtmlWidgetEvent" then

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
                      'playbackActive = true
                      timer.Start()
                    else if command = "off" then
                      'playbackActive = false
                      timer.Stop()
                    else if command = "blue" then
                      photoIndex% = -1
                      photoIds = photoManifest.albums["New Zealand -Abel Tasman"]
                    else if command = "red" then
                      photoIndex% = -1
                      photoIds = photoManifest.albums.Cabo2018
                    endif
                  endif
                endif
              endif

            endif
          endif
        endif

      endif
    endif
  end while

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
