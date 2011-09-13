Changelog
=========

v0.0.1
------
- Added socket validation so users cannot update user or game data on behalf of another user
- Added some cleanup to the socket close event
- Added changelog
- Fixed bug in getLoungeList that meant it would return games that are full
- Added leaveGame request to allow users to uh, leave
- Added toJSON function on Player object to avoid sending unnecessary data down the wire!
- Visual tweaks to the lounge
- Roughly implemented adding player name/avatar functionality from the lounge, complete with remembering cookie