Sub Main()

  print "PhotoPlayer start"
  manifest$ = ReadAsciiFile("usb1:/mediaItems/photoCollectionManifest.json")
  photoManifest = ParseJson(manifest$)

  photoIds = photoManifest.albums.Cabo2018
  numPhotos% = photoIds.count()
  photoIndex% = 0

  EnableZoneSupport(true)

  r = CreateObject("roRectangle", 0, 0, 1920, 1080)
  imagePlayer = CreateObject("roImageWidget", r)
  imagePlayer.SetDefaultMode(1)
	imagePlayer.Show()

  msgPort = CreateObject("roMessagePort")

  timer = CreateObject("roTimer")
  timer.setPort(msgPort)
  timer.SetElapsed(4, 0)
  timer.Start()

  aa = {}
  photoId$ = photoIds[photoIndex%]
  filePath$ = "usb1:/mediaItems/" + photoId$ + ".jpg"
  aa.filename = filePath$
  ok = imagePlayer.DisplayFile(aa)
  print "DisplayFile returned: ";ok
  print filePath$

  while true

    event = wait(0, msgPort)

    print "event: " + type(event)

    if type(event) = "roTimerEvent" then

      photoIndex% = photoIndex% + 1
      if photoIndex% >= numPhotos% then
        photoIndex% = 0
      endif

      photoId$ = photoIds[photoIndex%]
      filePath$ = "usb1:/mediaItems/" + photoId$ + ".jpg"
      aa.filename = filePath$
      ok = imagePlayer.DisplayFile(aa)
      print "DisplayFile returned: ";ok
      print filePath$

      timer.Start()

    endif

  end while

End Sub


Sub EventLoop(msgPort As Object)

  while true
    msg = wait(0, msgPort)
  end while

End Sub
