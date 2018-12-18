var socket = io();

angular.module('myapp', [])
	.controller('chatCtrl', function($scope){
		$scope.chats = [{
			message: 'hello',
			user: 0
		}, {
			message: 'how are you?',
			user: 1
		}];

		$scope.sendmsg = function(){
			if($scope.msg.trim() != ""){
				socket.emit("chat_message", $scope.msg.trim());
				$scope.chats.push({
					message: $scope.msg,
					user: 1
				});
				$scope.msg = "";
				socket.on('chat_response', function(msg){
					console.log('received response back: ' + msg)
					$scope.chats.push({
						message: msg,
						user: 0
					});
				});
			}
		}

	});