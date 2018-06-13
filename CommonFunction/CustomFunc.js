function SubXZQDM(xzqArray, xzqdm) {
    switch (xzqdm.length) {
        case 9:
            xzqArray.push(xzqdm.substr(0, 6));
            SubXZQDM(xzqArray, xzqdm.substr(0, 6));
            break;
        case 6:
            xzqArray.push(xzqdm.substr(0, 4));
            SubXZQDM(xzqArray, xzqdm.substr(0, 4));
            break;
        case 4:
            xzqArray.push(xzqdm.substr(0, 2));
            SubXZQDM(xzqArray, xzqdm.substr(0, 2));
            break;
        default:
            break;
    }
}

module.exports =
    {
        //// 根据xzqdm获取高级别的xzqdm
        GetXZQArray: (xzqdm) => {
            let xzqArray = new Array();
            xzqArray.push(xzqdm);
            SubXZQDM(xzqArray, xzqdm);
            return xzqArray;
        }
    }