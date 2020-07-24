import React from 'react';
import ReactDOM from 'react-dom';
import Gallery from '~/components/Gallery';

//globe css
import '~/style/index.scss';
import '~/style/index.css';

class App extends React.Component {
    constructor() {
        super();
        this.state = {
            showBullets: true
        };
        this.images = [
            {
                original: require('~/assets/image/1.jpg'),
                originalAlt: '',
                description: 'first picture'
            },
            {
                original: require('~/assets/image/2.jpg'),
                originalAlt: '',
                description: 'second picture'
            },
            {
                original: require('~/assets/image/3.jpg'),
                originalAlt: '',
                description: 'third picture'
            }
        ];
    }
    // _getStaticImages() {
    //     let images = []
    //     for (let i = 2; i < 3; i++) {
    //         images.push({
    //             original: `${PREFIX_URL}${i}.jpg`
    //         })
    //     }
    //     return images
    // }
    render() {
        return (
            <section className='app'>
                <Gallery
                    items={this.images}
                    showBullets={this.state.showBullets}
                    autoPlay={true}
                ></Gallery>
            </section>
        )
    }
}
ReactDOM.render(<App />, document.getElementById('container'));
