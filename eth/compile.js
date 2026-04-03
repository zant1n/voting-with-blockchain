const path = require('path');
const fs = require('fs-extra');
const solc = require('solc');
//define the path of files
const buildPath = path.resolve(__dirname, 'build');
const contractPath = path.resolve(__dirname, 'contracts', 'Voting.sol');
//remove old build folder
fs.removeSync(buildPath);

const source = fs.readFileSync(contractPath,'utf8');

const input = {
    language: 'Solidity',
    sources: {
        'Voting.sol': {
            content: source,
        },
    },
    settings: {
        outputSelection: {
            '*': {
                '*': ['abi', 'evm.bytecode.object'],
            },
        },
    },
};

console.log ('compiling voting.sol......')
//compile code with JSON 
const compiledCode = JSON.parse(solc.compile(JSON.stringify(input)));

if (compiledCode.errors){
    let hasError = false;
    compiledCode.errors.forEach((Err) => {
        console.errors(Err.formattedMessage);
        if (Err.severity === 'error') hasError = true;
    });
    if (hasError) process.exit(1);
}
// check build folder if exists, if not create one.
fs.ensureDirSync(buildPath);

//output file to build.
for(let contract in output) {
	fs.outputJsonSync(
		path.resolve(buildPath,contract.replace(':','') +  '.json'), 
		output[contract]
	);
}
