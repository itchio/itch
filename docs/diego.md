
# diego

diego is our diagnostics mercenary: it attempts to dump information about the
Operating System, CPU and Graphics Card to a log file when someone tries to
install a game.

You can [read its source](../util/diego.js), or look at these example outputs


## Example outputs

Windows 8.1 64-bit, Intel Core i3, GTX 560 Ti:

```
[Tue, 15 Dec 2015 14:02:36 GMT] [diego] diego here, looking around
[Tue, 15 Dec 2015 14:02:37 GMT] [diego] 
[Tue, 15 Dec 2015 14:02:37 GMT] [diego] Microsoft Windows [Version 6.3.9600]
[Tue, 15 Dec 2015 14:02:37 GMT] [diego] Caption                               MaxClockSpeed  Name                                             
[Tue, 15 Dec 2015 14:02:37 GMT] [diego] Intel64 Family 6 Model 37 Stepping 5  3077           Intel(R) Core(TM) i3 CPU         540  @ 3.07GHz  
[Tue, 15 Dec 2015 14:02:37 GMT] [diego] 
[Tue, 15 Dec 2015 14:02:37 GMT] [diego] Name                       
[Tue, 15 Dec 2015 14:02:37 GMT] [diego] NVIDIA GeForce GTX 560 Ti  
[Tue, 15 Dec 2015 14:02:37 GMT] [diego] 
[Tue, 15 Dec 2015 14:02:37 GMT] [diego] diego out
```
