/*
 * Copyright IBM Corp. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

'use strict';

const { Contract } = require('fabric-contract-api');

class ShareTransfer extends Contract {

    async InitLedger(ctx) {

        const shares = [
            {  
                ID: "0", 
                Owner: 'Enterprise', 
                Price: 1000, 
                prevOwners: [],
            },
            { 
                ID: "1", 
                Owner: 'Enterprise', 
                Price: 1000, 
                prevOwners: [],
            },
            { 
                ID: "2", 
                Owner: 'Enterprise', 
                Price: 1000, 
                prevOwners: [],
            },
            { 
                ID: "3", 
                Owner: 'CEO', 
                Price: 1000, 
                prevOwners: [],
            },
            { 
                ID: "4", 
                Owner: 'CEO',
                Price: 1000, 
                prevOwners: [],
            },
        ];

        for (const share of shares) {
            share.docType = 'share';
            await ctx.stub.putState(share.ID, Buffer.from(JSON.stringify(share)));
            console.info(`Share ${share.ID} initialized`);
        }
    }

    // CreateShare issues a new share to the world state with given details.
    async CreateShare(ctx,id) {
        const share = {
            ID: id,
            Owner: "Enterprise",
            Price: 1000, 
            prevOwners: [],
        };
        ctx.stub.putState(id, Buffer.from(JSON.stringify(share)));
        return JSON.stringify(share);
    }

    // DeleteShare deletes an given Share from the world state.
    async DeleteShare(ctx, id) {
        const exists = await this.ShareExists(ctx, id);
        if (!exists) {
            throw new Error(`The Share ${id} does not exist`);
        }

        
        const shareString = await this.ReadShare(ctx, id);
        const share = JSON.parse(shareString);
        if (share.Owner != "Enterprise"){
            throw new Error(`The Share must be deleted if Enterprise is the owner.`);
        }; // solo Enterprise puede eliminar acciones del mercado.
        
        return ctx.stub.deleteState(id);
    }


    // ReadShare returns the Share stored in the world state with given id.
    async ReadShare(ctx, id) {
        const shareJSON = await ctx.stub.getState(id); // get the share from chaincode state
        if (!shareJSON || shareJSON.length === 0) {
            throw new Error(`The share ${id} does not exist`);
        }
        return shareJSON.toString();
    }

    // ShareExists returns true when Share with given ID exists in world state.
    async ShareExists(ctx, id) {
        const shareJSON = await ctx.stub.getState(id);
        return shareJSON && shareJSON.length > 0;
    }

    // TransferShare updates the owner field of Share with given id in the world state.
    async TransferShare(ctx, id, newOwner) {
        const shareString = await this.ReadShare(ctx, id);
        const share = JSON.parse(shareString);
        share.prevOwners.push(share.Owner);
        share.Owner = newOwner;
        return ctx.stub.putState(id, Buffer.from(JSON.stringify(share)));
    }

    // GetAllShares returns all Shares found in the world state.
    async GetAllShares(ctx) {
        const allResults = [];
        // range query with empty string for startKey and endKey does an open-ended query of all Shares in the chaincode namespace.
        const iterator = await ctx.stub.getStateByRange('', '');
        let result = await iterator.next();
        while (!result.done) {
            const strValue = Buffer.from(result.value.value.toString()).toString('utf8');
            let record;
            try {
                record = JSON.parse(strValue);
            } catch (err) {
                console.log(err);
                record = strValue;
            }
            allResults.push({ Key: result.value.key, Record: record });
            result = await iterator.next();
        }
        return JSON.stringify(allResults);
    }

}

module.exports = ShareTransfer;