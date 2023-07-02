class ModelReply {
    constructor(payload) {
        this._verifyPayload(payload);

        this.id = payload.id;
        this.username = payload.username;
        this.date = payload.date;
        this.content = (payload.isDeleted) ? '**balasan telah dihapus**' : payload.content;
    }

    _verifyPayload({
        id, username, date, content, isDeleted,
    }) {
        if (!id || !username || !date || !content || typeof isDeleted === 'undefined') {
            throw new Error('COMMENT.NOT_CONTAIN_NEEDED_PROPERTY');
        }

        if (
            typeof id !== 'string' || typeof username !== 'string'
            || !(date instanceof Date) || typeof content !== 'string'
            || typeof isDeleted !== 'boolean'
        ) {
            throw new Error('COMMENT.NOT_MEET_DATA_TYPE_SPECIFICATION');
        }
    }
}

module.exports = ModelReply;
