const initialState = {};

const peerVolumes = (state = initialState, action) =>
{
	switch (action.type)
	{
		case 'SET_PEER_VOLUME':
		{
			const { peerId } = action.payload;
			const dBs = action.payload.volume < -100 ? -100 : action.payload.volume;

			return { ...state, [peerId]: dBs };
		}
		case 'CLEAR_PEER_VOLUME':
		{
			return {};
		}
		case 'DELETE_PEER_VOLUME':
		{
			const { peerId } = action.payload;
			if(state[peerId]){
				delete state[peerId];
			}
			return {...state};
		}

		default:
			return state;
	}
};

export default peerVolumes;
