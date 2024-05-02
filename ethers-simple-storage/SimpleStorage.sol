// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract SimpleStorage {
    uint256 myFavoriteNumber; // 0

    struct Person {
        uint256 favoriteNumber;
        string name;
    }

    Person public pat = Person({favoriteNumber: 7, name: "Pat"});

    Person[] public friends;

    mapping(string => uint256) public nameToNumber;

    function store(uint256 _favoriteNumber) public {
        myFavoriteNumber = _favoriteNumber;
    }

    // view - reading from state
    function retrieve() public view returns (uint256) {
        return myFavoriteNumber;
    }

    // pure - just reading
    function pure_r() public pure returns (uint256) {
        return 6;
    }

    // calldata, memory
    // temporary data
    // memory - mutable, callable - immutable

    // storage will stay for the whole duration of the contract - cannot be used with method arguments

    function addPerson(string memory _name, uint256 _favoriteNumber) public {
        friends.push(Person(_favoriteNumber, _name));
        nameToNumber[_name] = _favoriteNumber;
    }
}
