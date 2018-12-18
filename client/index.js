var socket = io();
console.log('comes here')
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
				$scope.chats.push({
					message: $scope.msg,
					user: 1
				});
				$scope.msg = "";
			}
		}

	});