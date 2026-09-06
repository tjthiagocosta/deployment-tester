# shared-lib

A directory no fixture builds from. It exists so a service can widen its watch paths past its
build root and prove that a push touching only this folder still deploys it
(nouva-platform#185).
